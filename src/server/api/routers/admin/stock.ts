import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, gt, gte, ilike, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { productImages, products, stockLogs, users } from "@/server/db/schema";
import { adminProcedure, createTRPCRouter } from "../../trpc";
import { available, likePattern, pageCount } from "@/server/db/helpers";

export const adminStockRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z.object({
        q: z.string().trim().max(100).optional(),
        lowStockOnly: z.boolean().default(false),
        lockedOnly: z.boolean().default(false),
        lowStockThreshold: z.number().int().min(0).default(2),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = and(
        input.q ? ilike(products.name, likePattern(input.q)) : undefined,
        input.lowStockOnly ? lte(available, input.lowStockThreshold) : undefined,
        input.lockedOnly ? gt(products.stockLocked, 0) : undefined
      );
      const [items, [{ total }]] = await Promise.all([
        ctx.db
          .select({
            id: products.id,
            name: products.name,
            condition: products.condition,
            isActive: products.isActive,
            stockPhysical: products.stockPhysical,
            stockLocked: products.stockLocked,
            available,
            thumbnailUrl: sql<string | null>`(select ${productImages.url} from ${productImages} where ${productImages.productId} = "products"."id" order by ${productImages.position} asc limit 1)`,
            lastChange: sql<Date | null>`(select max(${stockLogs.createdAt}) from ${stockLogs} where ${stockLogs.productId} = "products"."id")`.mapWith(
              (v) => (v ? new Date(v) : null)
            ),
          })
          .from(products)
          .where(where)
          .orderBy(asc(available), asc(products.name))
          .limit(input.pageSize)
          .offset((input.page - 1) * input.pageSize),
        ctx.db.select({ total: count() }).from(products).where(where),
      ]);
      return {
        items,
        total,
        page: input.page,
        pageCount: pageCount(total, input.pageSize),
      };
    }),

  todayActivity: adminProcedure.query(async ({ ctx }) => {
    const start = sql`date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta'`;
    const rows = await ctx.db
      .select({
        reason: stockLogs.reason,
        entries: count(),
        units: sql<number>`coalesce(sum(abs(${stockLogs.change})), 0)::int`,
      })
      .from(stockLogs)
      .where(gte(stockLogs.createdAt, sql`${start}`))
      .groupBy(stockLogs.reason);
    const by = Object.fromEntries(rows.map((r) => [r.reason, r]));
    return {
      sold: by.terjual?.units ?? 0,
      adjusted: by.penyesuaian?.entries ?? 0,
      locked: by.kunci?.units ?? 0,
      released: by.lepas?.units ?? 0,
    };
  }),

  adjust: adminProcedure
    .input(
      z.object({
        productId: z.uuid(),
        newPhysical: z.number().int().min(0),
        note: z.string().trim().max(300).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, input.productId))
          .for("update");
        if (!product) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Produk tidak ditemukan" });
        }
        if (input.newPhysical < product.stockLocked) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Stok fisik tidak boleh di bawah stok terkunci (${product.stockLocked})`,
          });
        }
        const change = input.newPhysical - product.stockPhysical;
        if (change === 0) return { stockPhysical: product.stockPhysical };
        await tx
          .update(products)
          .set({ stockPhysical: input.newPhysical })
          .where(eq(products.id, product.id));
        await tx.insert(stockLogs).values({
          productId: product.id,
          change,
          reason: "penyesuaian",
          actorId: ctx.user.id,
          note: input.note,
        });
        return { stockPhysical: input.newPhysical };
      });
    }),

  logs: adminProcedure
    .input(
      z.object({
        productId: z.uuid(),
        limit: z.number().int().min(1).max(200).default(50),
      })
    )
    .query(({ ctx, input }) =>
      ctx.db
        .select({
          id: stockLogs.id,
          change: stockLogs.change,
          reason: stockLogs.reason,
          note: stockLogs.note,
          orderId: stockLogs.orderId,
          actorName: users.name,
          createdAt: stockLogs.createdAt,
        })
        .from(stockLogs)
        .leftJoin(users, eq(users.id, stockLogs.actorId))
        .where(eq(stockLogs.productId, input.productId))
        .orderBy(desc(stockLogs.createdAt))
        .limit(input.limit)
    ),
});
