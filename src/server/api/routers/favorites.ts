import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { available } from "@/server/db/helpers";
import {
  categories,
  favorites,
  productImages,
  products,
} from "@/server/db/schema";
import { createTRPCRouter, customerProcedure } from "../trpc";

export const favoritesRouter = createTRPCRouter({
  ids: customerProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ productId: favorites.productId })
      .from(favorites)
      .where(eq(favorites.userId, ctx.user.id));
    return rows.map((r) => r.productId);
  }),

  list: customerProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        condition: products.condition,
        available,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(favorites)
      .innerJoin(products, eq(products.id, favorites.productId))
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(and(eq(favorites.userId, ctx.user.id), eq(products.isActive, true)))
      .orderBy(desc(favorites.createdAt));
    if (rows.length === 0) return [];
    const images = await ctx.db
      .select()
      .from(productImages)
      .where(
        inArray(
          productImages.productId,
          rows.map((r) => r.id)
        )
      )
      .orderBy(asc(productImages.position));
    const first = new Map<string, string>();
    for (const img of images) if (!first.has(img.productId)) first.set(img.productId, img.url);
    return rows.map((r) => ({ ...r, image: first.get(r.id) ?? null }));
  }),

  toggle: customerProcedure
    .input(z.object({ productId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const removed = await ctx.db
        .delete(favorites)
        .where(
          and(eq(favorites.userId, ctx.user.id), eq(favorites.productId, input.productId))
        )
        .returning({ productId: favorites.productId });
      if (removed.length > 0) return { favorited: false };
      await ctx.db
        .insert(favorites)
        .values({ userId: ctx.user.id, productId: input.productId })
        .onConflictDoNothing();
      return { favorited: true };
    }),
});
