import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
  orderItems,
  orders,
  orderStatusLogs,
  products,
  stockLogs,
} from "@/server/db/schema";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type OrderStatus = (typeof orders.$inferSelect)["status"];

export const UNPAID_STATUSES: OrderStatus[] = [
  "menunggu_pembayaran",
  "menunggu_konfirmasi",
];

export const PAID_STATUSES: OrderStatus[] = ["dibayar", "diproses", "selesai"];

export const PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000;

export function generateOrderCode(now = new Date()) {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CJT-${date}-${rand}`;
}

export async function getOrderForUpdate(tx: Tx, code: string) {
  const [order] = await tx
    .select()
    .from(orders)
    .where(eq(orders.code, code))
    .for("update");
  if (!order) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Pesanan tidak ditemukan" });
  }
  return order;
}

export async function logStatus(
  tx: Tx,
  orderId: string,
  from: OrderStatus | null,
  to: OrderStatus,
  actorId: string | null,
  note?: string
) {
  await tx.update(orders).set({ status: to }).where(eq(orders.id, orderId));
  await tx
    .insert(orderStatusLogs)
    .values({ orderId, fromStatus: from, toStatus: to, actorId, note });
}

async function lockOrderProducts(tx: Tx, orderId: string) {
  const items = await tx
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
  if (items.length === 0) return { items, locked: new Map<string, typeof products.$inferSelect>() };
  const rows = await tx
    .select()
    .from(products)
    .where(
      inArray(
        products.id,
        items.map((i) => i.productId)
      )
    )
    .orderBy(products.id)
    .for("update");
  return { items, locked: new Map(rows.map((p) => [p.id, p])) };
}

export async function lockStockForItems(
  tx: Tx,
  items: { productId: string; quantity: number }[],
  orderId: string,
  actorId: string | null
) {
  for (const item of items) {
    await tx
      .update(products)
      .set({ stockLocked: sql`${products.stockLocked} + ${item.quantity}` })
      .where(eq(products.id, item.productId));
    await tx.insert(stockLogs).values({
      productId: item.productId,
      change: item.quantity,
      reason: "kunci",
      orderId,
      actorId,
    });
  }
}

export async function releaseStock(
  tx: Tx,
  orderId: string,
  actorId: string | null
) {
  const { items } = await lockOrderProducts(tx, orderId);
  for (const item of items) {
    await tx
      .update(products)
      .set({ stockLocked: sql`${products.stockLocked} - ${item.quantity}` })
      .where(eq(products.id, item.productId));
    await tx.insert(stockLogs).values({
      productId: item.productId,
      change: -item.quantity,
      reason: "lepas",
      orderId,
      actorId,
    });
  }
}

export async function sellStock(
  tx: Tx,
  orderId: string,
  actorId: string | null
) {
  const { items } = await lockOrderProducts(tx, orderId);
  for (const item of items) {
    await tx
      .update(products)
      .set({
        stockLocked: sql`${products.stockLocked} - ${item.quantity}`,
        stockPhysical: sql`${products.stockPhysical} - ${item.quantity}`,
      })
      .where(eq(products.id, item.productId));
    await tx.insert(stockLogs).values({
      productId: item.productId,
      change: -item.quantity,
      reason: "terjual",
      orderId,
      actorId,
    });
  }
}

export async function cancelOrderInTx(
  tx: Tx,
  order: typeof orders.$inferSelect,
  actorId: string | null,
  note?: string
) {
  if (!UNPAID_STATUSES.includes(order.status)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Pesanan yang sudah dibayar tidak dapat dibatalkan",
    });
  }
  await releaseStock(tx, order.id, actorId);
  await tx.update(orders).set({ expiresAt: null }).where(eq(orders.id, order.id));
  await logStatus(tx, order.id, order.status, "dibatalkan", actorId, note);
}

export async function markPaidInTx(
  tx: Tx,
  order: typeof orders.$inferSelect,
  actorId: string | null,
  note?: string
) {
  if (!UNPAID_STATUSES.includes(order.status)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Status pesanan tidak memungkinkan pembayaran dikonfirmasi",
    });
  }
  await sellStock(tx, order.id, actorId);
  await tx.update(orders).set({ expiresAt: null }).where(eq(orders.id, order.id));
  await logStatus(tx, order.id, order.status, "dibayar", actorId, note);
}

export async function expireOverdueOrders() {
  const overdue = await db
    .select({ code: orders.code })
    .from(orders)
    .where(
      and(
        eq(orders.status, "menunggu_pembayaran"),
        isNotNull(orders.expiresAt),
        lt(orders.expiresAt, new Date())
      )
    );
  for (const { code } of overdue) {
    await db.transaction(async (tx) => {
      const order = await getOrderForUpdate(tx, code);
      if (
        order.status !== "menunggu_pembayaran" ||
        !order.expiresAt ||
        order.expiresAt > new Date()
      ) {
        return;
      }
      await cancelOrderInTx(tx, order, null, "Kedaluwarsa: tidak ada bukti pembayaran dalam 24 jam");
    });
  }
  return overdue.length;
}
