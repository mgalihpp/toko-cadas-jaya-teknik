import { TRPCError } from "@trpc/server";
import { asc, count, eq } from "drizzle-orm";
import { z } from "zod";
import { categories, products } from "@/server/db/schema";
import { randomSuffix, slugify } from "@/lib/slug";
import { adminProcedure, createTRPCRouter } from "../../trpc";
import type { Db } from "@/server/db";

const nameInput = z.string().trim().min(2).max(80);

async function uniqueSlug(db: Db, name: string, ignoreId?: string) {
  const base = slugify(name) || "kategori";
  const [hit] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, base));
  return hit && hit.id !== ignoreId ? `${base}-${randomSuffix()}` : base;
}

export const adminCategoriesRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) =>
    ctx.db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        productCount: count(products.id),
      })
      .from(categories)
      .leftJoin(products, eq(products.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(asc(categories.name))
  ),

  create: adminProcedure
    .input(z.object({ name: nameInput }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(categories)
        .values({ name: input.name, slug: await uniqueSlug(ctx.db, input.name) })
        .returning();
      return row;
    }),

  update: adminProcedure
    .input(z.object({ id: z.uuid(), name: nameInput }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .update(categories)
        .set({
          name: input.name,
          slug: await uniqueSlug(ctx.db, input.name, input.id),
        })
        .where(eq(categories.id, input.id))
        .returning();
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kategori tidak ditemukan" });
      }
      return row;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [{ used }] = await ctx.db
        .select({ used: count() })
        .from(products)
        .where(eq(products.categoryId, input.id));
      if (used > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Kategori masih dipakai produk dan tidak dapat dihapus",
        });
      }
      await ctx.db.delete(categories).where(eq(categories.id, input.id));
    }),
});
