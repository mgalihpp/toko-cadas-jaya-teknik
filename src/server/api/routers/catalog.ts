import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
} from "drizzle-orm";
import { z } from "zod";
import { CONDITIONS, categories, productImages, products } from "@/server/db/schema";
import { available, likePattern, pageCount } from "@/server/db/helpers";
import { createTRPCRouter, publicProcedure } from "../trpc";
import type { Db } from "@/server/db";

const firstImages = async (
  db: Db,
  productIds: string[]
) => {
  if (productIds.length === 0) return new Map<string, string>();
  const rows = await db
    .select()
    .from(productImages)
    .where(inArray(productImages.productId, productIds))
    .orderBy(asc(productImages.position));
  const map = new Map<string, string>();
  for (const row of rows) if (!map.has(row.productId)) map.set(row.productId, row.url);
  return map;
};

export const listInput = z.object({
  q: z.string().trim().max(100).optional(),
  categorySlug: z.string().optional(),
  condition: z.enum(CONDITIONS).optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().min(0).optional(),
  sort: z.enum(["terbaru", "termurah", "termahal"]).default("terbaru"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(48).default(12),
});

export const catalogRouter = createTRPCRouter({
  categories: publicProcedure.query(async ({ ctx }) => {
    const [rows, imageRows] = await Promise.all([
      ctx.db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          icon: categories.icon,
          productCount: count(products.id),
        })
        .from(categories)
        .leftJoin(
          products,
          and(eq(products.categoryId, categories.id), eq(products.isActive, true))
        )
        .groupBy(categories.id)
        .orderBy(asc(categories.name)),
      ctx.db
        .select({ categoryId: products.categoryId, url: productImages.url })
        .from(productImages)
        .innerJoin(products, eq(products.id, productImages.productId))
        .where(eq(products.isActive, true))
        .orderBy(desc(products.createdAt), asc(productImages.position)),
    ]);
    const imageByCategory = new Map<string, string>();
    for (const row of imageRows) {
      if (!imageByCategory.has(row.categoryId)) imageByCategory.set(row.categoryId, row.url);
    }
    return rows.map((row) => ({ ...row, image: imageByCategory.get(row.id) ?? null }));
  }),

  products: publicProcedure.input(listInput).query(async ({ ctx, input }) => {
    const where = and(
      eq(products.isActive, true),
      input.q
        ? or(
            ilike(products.name, likePattern(input.q)),
            ilike(products.description, likePattern(input.q))
          )
        : undefined,
      input.categorySlug ? eq(categories.slug, input.categorySlug) : undefined,
      input.condition ? eq(products.condition, input.condition) : undefined,
      input.minPrice !== undefined ? gte(products.price, input.minPrice) : undefined,
      input.maxPrice !== undefined ? lte(products.price, input.maxPrice) : undefined
    );
    const order =
      input.sort === "termurah"
        ? asc(products.price)
        : input.sort === "termahal"
          ? desc(products.price)
          : desc(products.createdAt);

    const [rows, [{ total }]] = await Promise.all([
      ctx.db
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
        .from(products)
        .innerJoin(categories, eq(categories.id, products.categoryId))
        .where(where)
        .orderBy(order, asc(products.id))
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize),
      ctx.db
        .select({ total: count() })
        .from(products)
        .innerJoin(categories, eq(categories.id, products.categoryId))
        .where(where),
    ]);

    const images = await firstImages(
      ctx.db,
      rows.map((r) => r.id)
    );
    return {
      items: rows.map((r) => ({ ...r, image: images.get(r.id) ?? null })),
      total,
      page: input.page,
      pageSize: input.pageSize,
      pageCount: pageCount(total, input.pageSize),
    };
  }),

  productBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const [product] = await ctx.db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          description: products.description,
          specs: products.specs,
          price: products.price,
          condition: products.condition,
          available,
          categoryName: categories.name,
          categorySlug: categories.slug,
        })
        .from(products)
        .innerJoin(categories, eq(categories.id, products.categoryId))
        .where(and(eq(products.slug, input.slug), eq(products.isActive, true)));
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Produk tidak ditemukan" });
      }
      const images = await ctx.db
        .select({ id: productImages.id, url: productImages.url })
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(asc(productImages.position));
      return { ...product, images };
    }),

  home: publicProcedure.query(async ({ ctx }) => {
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
      .from(products)
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt))
      .limit(12);
    const images = await firstImages(
      ctx.db,
      rows.map((r) => r.id)
    );
    return rows.map((r) => ({ ...r, image: images.get(r.id) ?? null }));
  }),
});
