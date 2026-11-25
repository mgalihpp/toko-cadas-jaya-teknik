import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  cartItems,
  orderItems,
  orders,
  orderStatusLogs,
  payments,
  products,
} from "@/server/db/schema";
import {
  cancelOrderInTx,
  expireOverdueOrders,
  generateOrderCode,
  getOrderForUpdate,
  logStatus,
  lockStockForItems,
  getPaymentWindowMs,
} from "@/server/services/orders";
import { createTRPCRouter, customerProcedure } from "../trpc";
import type { Db } from "@/server/db";

const checkoutInput = z
  .object({
    recipientName: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(8).max(20),
    fulfillment: z.enum(["kirim", "ambil"]),
    address: z.string().trim().max(500).optional(),
    paymentMethod: z.enum(["tunai", "transfer"]),
  })
  .refine((v) => v.fulfillment === "ambil" || (v.address && v.address.length >= 5), {
    path: ["address"],
    message: "Alamat pengiriman wajib diisi",
  });

const codeInput = z.object({ code: z.string().min(1) });

async function getOwnOrder(
  db: Db,
  userId: string,
  code: string
) {
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.code, code), eq(orders.userId, userId)),
    with: {
      items: true,
      payments: { orderBy: [desc(payments.createdAt)] },
      statusLogs: { orderBy: [asc(orderStatusLogs.createdAt)] },
    },
  });
  if (!order) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Pesanan tidak ditemukan" });
  }
  return order;
}

export const ordersRouter = createTRPCRouter({
  checkout: customerProcedure
    .input(checkoutInput)
    .mutation(async ({ ctx, input }) => {
      await expireOverdueOrders();

      return ctx.db.transaction(async (tx) => {
        const cart = await tx
          .select()
          .from(cartItems)
          .where(eq(cartItems.userId, ctx.user.id));
        if (cart.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Keranjang kosong" });
        }

        const locked = await tx
          .select()
          .from(products)
          .where(
            inArray(
              products.id,
              cart.map((c) => c.productId)
            )
          )
          .orderBy(products.id)
          .for("update");
        const byId = new Map(locked.map((p) => [p.id, p]));

        const lines = cart.map((c) => {
          const p = byId.get(c.productId);
          if (!p || !p.isActive) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Ada produk di keranjang yang sudah tidak tersedia",
            });
          }
          const free = p.stockPhysical - p.stockLocked;
          if (free < c.quantity) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                free <= 0
                  ? `Stok "${p.name}" habis`
                  : `Stok "${p.name}" tersisa ${free}`,
            });
          }
          return {
            productId: p.id,
            productName: p.name,
            unitPrice: p.price,
            quantity: c.quantity,
          };
        });

        const windowMs = await getPaymentWindowMs(tx);
        const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
        const [order] = await tx
          .insert(orders)
          .values({
            code: generateOrderCode(),
            userId: ctx.user.id,
            recipientName: input.recipientName,
            phone: input.phone,
            fulfillment: input.fulfillment,
            address: input.fulfillment === "kirim" ? input.address : null,
            paymentMethod: input.paymentMethod,
            total,
            expiresAt:
              input.paymentMethod === "transfer"
                ? new Date(Date.now() + windowMs)
                : null,
          })
          .returning();

        await tx
          .insert(orderItems)
          .values(lines.map((l) => ({ ...l, orderId: order.id })));
        await lockStockForItems(tx, lines, order.id, ctx.user.id);
        await logStatus(tx, order.id, null, "menunggu_pembayaran", ctx.user.id, "Pesanan dibuat");
        await tx.delete(cartItems).where(eq(cartItems.userId, ctx.user.id));

        return { code: order.code, total };
      });
    }),

  list: customerProcedure.query(async ({ ctx }) => {
    await expireOverdueOrders();
    return ctx.db.query.orders.findMany({
      where: eq(orders.userId, ctx.user.id),
      orderBy: [desc(orders.createdAt)],
      with: { items: true },
    });
  }),

  byCode: customerProcedure.input(codeInput).query(async ({ ctx, input }) => {
    await expireOverdueOrders();
    return getOwnOrder(ctx.db, ctx.user.id, input.code);
  }),

  cancel: customerProcedure.input(codeInput).mutation(async ({ ctx, input }) => {
    await ctx.db.transaction(async (tx) => {
      const order = await getOrderForUpdate(tx, input.code);
      if (order.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pesanan tidak ditemukan" });
      }
      await cancelOrderInTx(tx, order, ctx.user.id, "Dibatalkan customer");
    });
  }),

  submitProof: customerProcedure
    .input(
      codeInput.extend({
        proofUrl: z.url(),
        proofKey: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        const order = await getOrderForUpdate(tx, input.code);
        if (order.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pesanan tidak ditemukan" });
        }
        if (order.paymentMethod !== "transfer") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Pesanan ini tidak memakai pembayaran transfer",
          });
        }
        if (order.status !== "menunggu_pembayaran") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Bukti pembayaran tidak dapat diunggah pada status ini",
          });
        }
        await tx.insert(payments).values({
          orderId: order.id,
          method: "transfer",
          amount: order.total,
          proofUrl: input.proofUrl,
          proofKey: input.proofKey,
        });
        await tx.update(orders).set({ expiresAt: null }).where(eq(orders.id, order.id));
        await logStatus(
          tx,
          order.id,
          order.status,
          "menunggu_konfirmasi",
          ctx.user.id,
          "Bukti pembayaran diunggah"
        );
      });
    }),
});
