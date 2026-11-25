import { and, asc, count, desc, eq, gte, inArray, lt, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { alias } from "drizzle-orm/pg-core";
import {
  categories,
  orderItems,
  orders,
  payments,
  productImages,
  products,
  users,
} from "@/server/db/schema";
import { expireOverdueOrders } from "@/server/services/orders";
import { adminProcedure, createTRPCRouter } from "../../trpc";
import { available, pageCount } from "@/server/db/helpers";

const range = z.object({ from: z.date(), to: z.date() });

const confirmer = alias(users, "confirmer");

export const adminFinanceRouter = createTRPCRouter({
  transactions: adminProcedure
    .input(
      z.object({
        method: z.enum(["tunai", "transfer"]).optional(),
        status: z.enum(["menunggu", "diterima", "ditolak"]).optional(),
        from: z.date().optional(),
        to: z.date().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = and(
        input.method ? eq(payments.method, input.method) : undefined,
        input.status ? eq(payments.status, input.status) : undefined,
        input.from ? gte(payments.createdAt, input.from) : undefined,
        input.to ? lte(payments.createdAt, input.to) : undefined
      );
      const [items, [{ total }]] = await Promise.all([
        ctx.db
          .select({
            id: payments.id,
            orderCode: orders.code,
            customerName: orders.recipientName,
            confirmedByName: confirmer.name,
            method: payments.method,
            amount: payments.amount,
            status: payments.status,
            proofUrl: payments.proofUrl,
            ownerNote: payments.ownerNote,
            confirmedAt: payments.confirmedAt,
            createdAt: payments.createdAt,
          })
          .from(payments)
          .innerJoin(orders, eq(orders.id, payments.orderId))
          .leftJoin(confirmer, eq(confirmer.id, payments.confirmedBy))
          .where(where)
          .orderBy(desc(payments.createdAt))
          .limit(input.pageSize)
          .offset((input.page - 1) * input.pageSize),
        ctx.db.select({ total: count() }).from(payments).where(where),
      ]);
      return {
        items,
        total,
        page: input.page,
        pageCount: pageCount(total, input.pageSize),
      };
    }),

  sales: adminProcedure
    .input(range.extend({ groupBy: z.enum(["day", "month"]).default("day") }))
    .query(async ({ ctx, input }) => {
      const unit = sql.raw(`'${input.groupBy}'`);
      const period = sql<string>`to_char(date_trunc(${unit}, ${payments.confirmedAt} AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM-DD')`;
      const where = and(
        eq(payments.status, "diterima"),
        gte(payments.confirmedAt, input.from),
        lt(payments.confirmedAt, input.to)
      );
      const rows = await ctx.db
        .select({
          period,
          total: sql<number>`coalesce(sum(${payments.amount}), 0)::int`,
          transactions: sql<number>`count(distinct ${payments.orderId})::int`,
        })
        .from(payments)
        .where(where)
        .groupBy(period)
        .orderBy(asc(period));
      return {
        rows,
        total: rows.reduce((s, r) => s + r.total, 0),
        transactions: rows.reduce((s, r) => s + r.transactions, 0),
      };
    }),

  breakdown: adminProcedure.input(range).query(async ({ ctx, input }) => {
    const paid = and(
      eq(payments.status, "diterima"),
      gte(payments.confirmedAt, input.from),
      lt(payments.confirmedAt, input.to)
    );
    const revenue = sql<number>`coalesce(sum(${orderItems.unitPrice} * ${orderItems.quantity}), 0)::int`;
    const units = sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`;
    const [byCategory, byProduct] = await Promise.all([
      ctx.db
        .select({ id: categories.id, name: categories.name, revenue, units })
        .from(orderItems)
        .innerJoin(payments, eq(payments.orderId, orderItems.orderId))
        .innerJoin(products, eq(products.id, orderItems.productId))
        .innerJoin(categories, eq(categories.id, products.categoryId))
        .where(paid)
        .groupBy(categories.id, categories.name)
        .orderBy(desc(revenue))
        .limit(10),
      ctx.db
        .select({ id: orderItems.productId, name: sql<string>`max(${orderItems.productName})`, revenue, units })
        .from(orderItems)
        .innerJoin(payments, eq(payments.orderId, orderItems.orderId))
        .where(paid)
        .groupBy(orderItems.productId)
        .orderBy(desc(units), desc(revenue))
        .limit(10),
    ]);
    return { byCategory, byProduct };
  }),

  dashboard: adminProcedure.query(async ({ ctx }) => {
    await expireOverdueOrders();
    const jakartaDate = (col: unknown) => sql`(${col} AT TIME ZONE 'Asia/Jakarta')::date`;
    const today = sql`(now() AT TIME ZONE 'Asia/Jakarta')::date`;
    const [byStatus, lowStock, latestSales, created, salesToday] = await Promise.all([
      ctx.db
        .select({ status: orders.status, total: count() })
        .from(orders)
        .groupBy(orders.status),
      ctx.db
        .select({
          id: products.id,
          name: products.name,
          condition: products.condition,
          available,
        })
        .from(products)
        .where(and(eq(products.isActive, true), lte(available, 2)))
        .orderBy(asc(available), asc(products.name))
        .limit(10),
      ctx.db
        .select({
          code: orders.code,
          recipientName: orders.recipientName,
          total: orders.total,
          status: orders.status,
          paymentMethod: orders.paymentMethod,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(inArray(orders.status, ["dibayar", "diproses", "selesai"]))
        .orderBy(desc(orders.createdAt))
        .limit(5),
      ctx.db
        .select({
          today: sql<number>`count(*) filter (where ${jakartaDate(orders.createdAt)} = ${today})::int`,
          yesterday: sql<number>`count(*) filter (where ${jakartaDate(orders.createdAt)} = ${today} - 1)::int`,
        })
        .from(orders),
      ctx.db
        .select({
          total: sql<number>`coalesce(sum(${payments.amount}), 0)::int`,
          transactions: sql<number>`count(distinct ${payments.orderId})::int`,
        })
        .from(payments)
        .where(
          and(eq(payments.status, "diterima"), sql`${jakartaDate(payments.confirmedAt)} = ${today}`)
        ),
    ]);
    const lowIds = lowStock.map((p) => p.id);
    const lowImages = lowIds.length
      ? await ctx.db
          .select()
          .from(productImages)
          .where(inArray(productImages.productId, lowIds))
          .orderBy(asc(productImages.position))
      : [];
    const firstImage = new Map<string, string>();
    for (const img of lowImages) if (!firstImage.has(img.productId)) firstImage.set(img.productId, img.url);
    const counts = Object.fromEntries(byStatus.map((r) => [r.status, r.total]));
    return {
      awaitingPayment: counts.menunggu_pembayaran ?? 0,
      awaitingConfirmation: counts.menunggu_konfirmasi ?? 0,
      inProcess: (counts.dibayar ?? 0) + (counts.diproses ?? 0),
      lowStock: lowStock.map((p) => ({ ...p, image: firstImage.get(p.id) ?? null })),
      latestSales,
      newToday: created[0]?.today ?? 0,
      newYesterday: created[0]?.yesterday ?? 0,
      salesToday: salesToday[0] ?? { total: 0, transactions: 0 },
    };
  }),
});
