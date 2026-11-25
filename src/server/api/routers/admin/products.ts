import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  CONDITIONS,
  categories,
  orderItems,
  productImages,
  products,
  stockLogs,
} from "@/server/db/schema";
import { randomSuffix, slugify } from "@/lib/slug";
import { adminProcedure, createTRPCRouter } from "../../trpc";
import { available, likePattern, pageCount } from "@/server/db/helpers";
import type { Db } from "@/server/db";

const imageInput = z.object({
  url: z.url(),
  fileKey: z.string().optional(),
});

const productFields = z.object({
  name: z.string().trim().min(2).max(150),
  sku: z
    .string()
    .trim()
    .max(40)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
  description: z.string().trim().max(5000).default(""),
  specs: z.record(z.string().min(1), z.string()).default({}),
  price: z.number().int().positive(),
  condition: z.enum(CONDITIONS),
  categoryId: z.uuid(),
  isActive: z.boolean().default(true),
  images: z.array(imageInput).max(10).default([]),
});

async function uniqueSlug(
  db: Db,
  name: string,
  ignoreId?: string
) {
  const base = slugify(name) || "produk";
  const [hit] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, base));
  return hit && hit.id !== ignoreId ? `${base}-${randomSuffix()}` : base;
}

async function assertSkuFree(db: Db, sku: string | null, ignoreId?: string) {
  if (!sku) return;
  const [hit] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.sku, sku), ignoreId ? ne(products.id, ignoreId) : undefined));
  if (hit) {
    throw new TRPCError({ code: "CONFLICT", message: "SKU sudah dipakai produk lain" });
  }
}

export const adminProductsRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z.object({
        q: z.string().trim().max(100).optional(),
        categoryId: z.uuid().optional(),
        isActive: z.boolean().optional(),
        condition: z.enum(CONDITIONS).optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = and(
        input.q
          ? or(
              ilike(products.name, likePattern(input.q)),
              ilike(products.description, likePattern(input.q)),
              ilike(products.sku, likePattern(input.q))
            )
          : undefined,
        input.categoryId ? eq(products.categoryId, input.categoryId) : undefined,
        input.isActive !== undefined ? eq(products.isActive, input.isActive) : undefined,
        input.condition ? eq(products.condition, input.condition) : undefined
      );
      const [items, [{ total }]] = await Promise.all([
        ctx.db
          .select({
            id: products.id,
            name: products.name,
            slug: products.slug,
            sku: products.sku,
            thumbnailUrl: sql<string | null>`(select ${productImages.url} from ${productImages} where ${productImages.productId} = "products"."id" order by ${productImages.position} asc limit 1)`,
            price: products.price,
            condition: products.condition,
            isActive: products.isActive,
            stockPhysical: products.stockPhysical,
            stockLocked: products.stockLocked,
            available,
            categoryName: categories.name,
          })
          .from(products)
          .innerJoin(categories, eq(categories.id, products.categoryId))
          .where(where)
          .orderBy(desc(products.createdAt), asc(products.id))
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

  byId: adminProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.query.products.findFirst({
        where: eq(products.id, input.id),
        with: { images: { orderBy: [asc(productImages.position)] } },
      });
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Produk tidak ditemukan" });
      }
      return product;
    }),

  create: adminProcedure
    .input(productFields.extend({ stock: z.number().int().min(0).default(0) }))
    .mutation(async ({ ctx, input }) => {
      const { images, stock, ...fields } = input;
      await assertSkuFree(ctx.db, fields.sku);
      return ctx.db.transaction(async (tx) => {
        const [product] = await tx
          .insert(products)
          .values({
            ...fields,
            slug: await uniqueSlug(ctx.db, fields.name),
            stockPhysical: stock,
          })
          .returning();
        if (images.length) {
          await tx
            .insert(productImages)
            .values(images.map((img, position) => ({ ...img, position, productId: product.id })));
        }
        if (stock > 0) {
          await tx.insert(stockLogs).values({
            productId: product.id,
            change: stock,
            reason: "penyesuaian",
            actorId: ctx.user.id,
            note: "Stok awal",
          });
        }
        return product;
      });
    }),

  update: adminProcedure
    .input(productFields.extend({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, images, ...fields } = input;
      await assertSkuFree(ctx.db, fields.sku, id);
      return ctx.db.transaction(async (tx) => {
        const [product] = await tx
          .update(products)
          .set({ ...fields, slug: await uniqueSlug(ctx.db, fields.name, id) })
          .where(eq(products.id, id))
          .returning();
        if (!product) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Produk tidak ditemukan" });
        }
        await tx.delete(productImages).where(eq(productImages.productId, id));
        if (images.length) {
          await tx
            .insert(productImages)
            .values(images.map((img, position) => ({ ...img, position, productId: id })));
        }
        return product;
      });
    }),

  setActive: adminProcedure
    .input(z.object({ id: z.uuid(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(products)
        .set({ isActive: input.isActive })
        .where(eq(products.id, input.id));
    }),

  delete: adminProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [{ ordered }] = await ctx.db
        .select({ ordered: count() })
        .from(orderItems)
        .where(eq(orderItems.productId, input.id));
      if (ordered > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Produk sudah pernah dipesan. Nonaktifkan saja agar riwayat tetap utuh",
        });
      }
      await ctx.db.delete(products).where(eq(products.id, input.id));
    }),
});
