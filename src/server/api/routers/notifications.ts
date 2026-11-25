import { and, desc, eq, gt, gte, inArray } from "drizzle-orm";
import type { Db } from "@/server/db";
import {
  notificationReads,
  orders,
  orderStatusLogs,
  payments,
  products,
  stockLogs,
} from "@/server/db/schema";
import { createTRPCRouter, customerProcedure } from "../trpc";

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

export type NotificationGroup = "pesanan" | "info";

export type NotificationItem = {
  id: string;
  group: NotificationGroup;
  title: string;
  body: string;
  href: string;
  at: Date;
  unread: boolean;
};

const STATUS_COPY = {
  dibayar: ["Pembayaran dikonfirmasi", "dikonfirmasi Owner."],
  diproses: ["Pesanan diproses", "sedang disiapkan Owner."],
  selesai: ["Pesanan selesai", "sudah selesai. Terima kasih sudah berbelanja."],
  dibatalkan: ["Pesanan dibatalkan", "dibatalkan."],
} as const;

async function buildFeed(db: Db, userId: string): Promise<NotificationItem[]> {
  const now = Date.now();
  const since = new Date(now - 30 * DAY);

  const [reads, statusRows, rejectedRows, dueRows, stockRows] = await Promise.all([
    db
      .select({ readAt: notificationReads.readAt })
      .from(notificationReads)
      .where(eq(notificationReads.userId, userId)),
    db
      .select({
        id: orderStatusLogs.id,
        code: orders.code,
        status: orderStatusLogs.toStatus,
        at: orderStatusLogs.createdAt,
      })
      .from(orderStatusLogs)
      .innerJoin(orders, eq(orders.id, orderStatusLogs.orderId))
      .where(
        and(
          eq(orders.userId, userId),
          inArray(orderStatusLogs.toStatus, ["dibayar", "diproses", "selesai", "dibatalkan"]),
          gte(orderStatusLogs.createdAt, since)
        )
      )
      .orderBy(desc(orderStatusLogs.createdAt))
      .limit(30),
    db
      .select({
        id: payments.id,
        code: orders.code,
        note: payments.ownerNote,
        at: payments.confirmedAt,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .innerJoin(orders, eq(orders.id, payments.orderId))
      .where(
        and(
          eq(orders.userId, userId),
          eq(payments.status, "ditolak"),
          gte(payments.createdAt, since)
        )
      )
      .orderBy(desc(payments.createdAt))
      .limit(10),
    db
      .select({ id: orders.id, code: orders.code, expiresAt: orders.expiresAt })
      .from(orders)
      .where(
        and(
          eq(orders.userId, userId),
          eq(orders.status, "menunggu_pembayaran"),
          gt(orders.expiresAt, new Date(now))
        )
      ),
    db
      .select({
        id: stockLogs.id,
        change: stockLogs.change,
        name: products.name,
        slug: products.slug,
        at: stockLogs.createdAt,
      })
      .from(stockLogs)
      .innerJoin(products, eq(products.id, stockLogs.productId))
      .where(
        and(
          eq(stockLogs.reason, "penyesuaian"),
          gt(stockLogs.change, 0),
          eq(products.isActive, true),
          gte(stockLogs.createdAt, new Date(now - 14 * DAY))
        )
      )
      .orderBy(desc(stockLogs.createdAt))
      .limit(5),
  ]);

  const readAt = reads[0]?.readAt.getTime() ?? 0;
  const items: Omit<NotificationItem, "unread">[] = [];

  for (const r of statusRows) {
    const [title, tail] = STATUS_COPY[r.status as keyof typeof STATUS_COPY];
    items.push({
      id: `s-${r.id}`,
      group: "pesanan",
      title,
      body: `Pesanan ${r.code} ${tail}`,
      href: `/pesanan/${r.code}`,
      at: r.at,
    });
  }
  for (const r of rejectedRows) {
    items.push({
      id: `p-${r.id}`,
      group: "pesanan",
      title: "Bukti transfer ditolak",
      body: `${r.code}: ${r.note?.trim() || "Unggah ulang bukti transfer."}`,
      href: `/pesanan/${r.code}`,
      at: r.at ?? r.createdAt,
    });
  }
  for (const r of dueRows) {
    if (!r.expiresAt) continue;
    const left = r.expiresAt.getTime() - now;
    if (left > 3 * HOUR) continue;
    const hours = Math.max(1, Math.ceil(left / HOUR));
    items.push({
      id: `e-${r.id}`,
      group: "pesanan",
      title: "Segera bayar",
      body: `${r.code} dibatalkan otomatis dalam ${hours} jam.`,
      href: `/pesanan/${r.code}`,
      at: new Date(r.expiresAt.getTime() - 3 * HOUR),
    });
  }
  for (const r of stockRows) {
    items.push({
      id: `k-${r.id}`,
      group: "info",
      title: "Stok baru masuk",
      body: `${r.change} unit ${r.name} tersedia.`,
      href: `/produk/${r.slug}`,
      at: r.at,
    });
  }

  return items
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .map((i) => ({ ...i, unread: i.at.getTime() > readAt }));
}

export const notificationsRouter = createTRPCRouter({
  list: customerProcedure.query(async ({ ctx }) => {
    const items = await buildFeed(ctx.db, ctx.user.id);
    return { items, unreadCount: items.filter((i) => i.unread).length };
  }),

  unreadCount: customerProcedure.query(async ({ ctx }) => {
    const items = await buildFeed(ctx.db, ctx.user.id);
    return items.filter((i) => i.unread).length;
  }),

  markAllRead: customerProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .insert(notificationReads)
      .values({ userId: ctx.user.id, readAt: new Date() })
      .onConflictDoUpdate({
        target: notificationReads.userId,
        set: { readAt: new Date() },
      });
  }),
});
