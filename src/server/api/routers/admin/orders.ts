import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  ORDER_STATUSES,
  orderItems,
  orders,
  orderStatusLogs,
  payments,
} from "@/server/db/schema";
import {
  cancelOrderInTx,
  expireOverdueOrders,
  getOrderForUpdate,
  logStatus,
  markPaidInTx,
  getPaymentWindowMs,
} from "@/server/services/orders";
import { adminProcedure, createTRPCRouter } from "../../trpc";
import { likePattern, pageCount } from "@/server/db/helpers";

const codeInput = z.object({ code: z.string().min(1) });

export const adminOrdersRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z.object({
        status: z.enum(ORDER_STATUSES).optional(),
        q: z.string().trim().max(100).optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      await expireOverdueOrders();
      const where = and(
        input.status ? eq(orders.status, input.status) : undefined,
        input.q
          ? or(
              ilike(orders.code, likePattern(input.q)),
              ilike(orders.recipientName, likePattern(input.q))
            )
          : undefined
      );
      const [items, [{ total }]] = await Promise.all([
        ctx.db
          .select({
            id: orders.id,
            code: orders.code,
            recipientName: orders.recipientName,
            phone: orders.phone,
            itemCount: sql<number>`(select coalesce(sum(${orderItems.quantity}), 0)::int from ${orderItems} where ${orderItems.orderId} = "orders"."id")`,
            firstItem: sql<string | null>`(select ${orderItems.productName} from ${orderItems} where ${orderItems.orderId} = "orders"."id" order by ${orderItems.id} limit 1)`,
            lineCount: sql<number>`(select count(*)::int from ${orderItems} where ${orderItems.orderId} = "orders"."id")`,
            paymentMethod: orders.paymentMethod,
            fulfillment: orders.fulfillment,
            status: orders.status,
            total: orders.total,
            createdAt: orders.createdAt,
          })
          .from(orders)
          .where(where)
          .orderBy(desc(orders.createdAt))
          .limit(input.pageSize)
          .offset((input.page - 1) * input.pageSize),
        ctx.db.select({ total: count() }).from(orders).where(where),
      ]);
      return {
        items,
        total,
        page: input.page,
        pageCount: pageCount(total, input.pageSize),
      };
    }),

  byCode: adminProcedure.input(codeInput).query(async ({ ctx, input }) => {
    await expireOverdueOrders();
    const order = await ctx.db.query.orders.findFirst({
      where: eq(orders.code, input.code),
      with: {
        items: true,
        payments: { orderBy: [desc(payments.createdAt)] },
        statusLogs: { orderBy: [asc(orderStatusLogs.createdAt)] },
        user: { columns: { id: true, name: true, email: true, phone: true } },
      },
    });
    if (!order) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Pesanan tidak ditemukan" });
    }
    return order;
  }),

  advance: adminProcedure
    .input(codeInput.extend({ to: z.enum(["diproses", "selesai"]) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        const order = await getOrderForUpdate(tx, input.code);
        const allowed =
          (input.to === "diproses" && order.status === "dibayar") ||
          (input.to === "selesai" &&
            (order.status === "dibayar" || order.status === "diproses"));
        if (!allowed) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Pesanan berstatus "${order.status}" tidak dapat diubah ke "${input.to}"`,
          });
        }
        await logStatus(tx, order.id, order.status, input.to, ctx.user.id);
      });
    }),

  cancel: adminProcedure
    .input(codeInput.extend({ note: z.string().trim().max(300).optional() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        const order = await getOrderForUpdate(tx, input.code);
        await cancelOrderInTx(tx, order, ctx.user.id, input.note ?? "Dibatalkan admin");
        await tx
          .update(payments)
          .set({ status: "ditolak", ownerNote: input.note ?? "Pesanan dibatalkan" })
          .where(and(eq(payments.orderId, order.id), eq(payments.status, "menunggu")));
      });
    }),

  confirmTransfer: adminProcedure
    .input(codeInput)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        const order = await getOrderForUpdate(tx, input.code);
        if (order.paymentMethod !== "transfer" || order.status !== "menunggu_konfirmasi") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Tidak ada bukti transfer yang menunggu konfirmasi",
          });
        }
        const [payment] = await tx
          .select()
          .from(payments)
          .where(and(eq(payments.orderId, order.id), eq(payments.status, "menunggu")))
          .orderBy(desc(payments.createdAt))
          .limit(1);
        if (!payment) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Bukti pembayaran tidak ditemukan" });
        }
        await tx
          .update(payments)
          .set({ status: "diterima", confirmedBy: ctx.user.id, confirmedAt: new Date() })
          .where(eq(payments.id, payment.id));
        await markPaidInTx(tx, order, ctx.user.id, "Transfer dikonfirmasi");
      });
    }),

  rejectTransfer: adminProcedure
    .input(codeInput.extend({ note: z.string().trim().min(3).max(300) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        const order = await getOrderForUpdate(tx, input.code);
        if (order.status !== "menunggu_konfirmasi") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Tidak ada bukti transfer yang menunggu konfirmasi",
          });
        }
        await tx
          .update(payments)
          .set({
            status: "ditolak",
            ownerNote: input.note,
            confirmedBy: ctx.user.id,
            confirmedAt: new Date(),
          })
          .where(and(eq(payments.orderId, order.id), eq(payments.status, "menunggu")));
        await tx
          .update(orders)
          .set({ expiresAt: new Date(Date.now() + (await getPaymentWindowMs(tx))) })
          .where(eq(orders.id, order.id));
        await logStatus(
          tx,
          order.id,
          order.status,
          "menunggu_pembayaran",
          ctx.user.id,
          `Bukti ditolak: ${input.note}`
        );
      });
    }),

  recordCash: adminProcedure.input(codeInput).mutation(async ({ ctx, input }) => {
    await ctx.db.transaction(async (tx) => {
      const order = await getOrderForUpdate(tx, input.code);
      if (order.paymentMethod !== "tunai" || order.status !== "menunggu_pembayaran") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pembayaran tunai tidak dapat dicatat untuk pesanan ini",
        });
      }
      await tx.insert(payments).values({
        orderId: order.id,
        method: "tunai",
        amount: order.total,
        status: "diterima",
        confirmedBy: ctx.user.id,
        confirmedAt: new Date(),
      });
      await markPaidInTx(tx, order, ctx.user.id, "Pembayaran tunai dicatat");
    });
  }),
});
