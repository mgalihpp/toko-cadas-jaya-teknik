import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { cartItems, productImages, products } from "@/server/db/schema";
import { createTRPCRouter, customerProcedure } from "../trpc";
import { available } from "@/server/db/helpers";

const productInput = z.object({ productId: z.uuid() });
const qtyInput = z.number().int().min(1).max(999);

export const cartRouter = createTRPCRouter({
  list: customerProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: cartItems.id,
        productId: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        condition: products.condition,
        isActive: products.isActive,
        available,
        quantity: cartItems.quantity,
        image: productImages.url,
      })
      .from(cartItems)
      .innerJoin(products, eq(products.id, cartItems.productId))
      .leftJoin(
        productImages,
        and(eq(productImages.productId, products.id), eq(productImages.position, 0))
      )
      .where(eq(cartItems.userId, ctx.user.id))
      .orderBy(asc(cartItems.createdAt));
    const items = rows.map((r) => ({
      ...r,
      purchasable: r.isActive && r.available >= r.quantity,
    }));
    return {
      items,
      subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      canCheckout: items.length > 0 && items.every((i) => i.purchasable),
    };
  }),

  add: customerProcedure
    .input(productInput.extend({ quantity: qtyInput.default(1) }))
    .mutation(async ({ ctx, input }) => {
      const [product] = await ctx.db
        .select({ isActive: products.isActive, available, name: products.name })
        .from(products)
        .where(eq(products.id, input.productId));
      if (!product?.isActive) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Produk tidak ditemukan" });
      }
      const [existing] = await ctx.db
        .select({ quantity: cartItems.quantity })
        .from(cartItems)
        .where(
          and(
            eq(cartItems.userId, ctx.user.id),
            eq(cartItems.productId, input.productId)
          )
        );
      const next = (existing?.quantity ?? 0) + input.quantity;
      if (product.available <= 0) {
        throw new TRPCError({ code: "CONFLICT", message: `Stok "${product.name}" habis` });
      }
      if (next > product.available) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Stok "${product.name}" tersisa ${product.available}`,
        });
      }
      await ctx.db
        .insert(cartItems)
        .values({ userId: ctx.user.id, productId: input.productId, quantity: next })
        .onConflictDoUpdate({
          target: [cartItems.userId, cartItems.productId],
          set: { quantity: next },
        });
      return { quantity: next };
    }),

  setQuantity: customerProcedure
    .input(productInput.extend({ quantity: qtyInput }))
    .mutation(async ({ ctx, input }) => {
      const [product] = await ctx.db
        .select({ available, name: products.name })
        .from(products)
        .where(eq(products.id, input.productId));
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Produk tidak ditemukan" });
      }
      if (input.quantity > product.available) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Stok "${product.name}" tersisa ${Math.max(product.available, 0)}`,
        });
      }
      await ctx.db
        .update(cartItems)
        .set({ quantity: input.quantity })
        .where(
          and(
            eq(cartItems.userId, ctx.user.id),
            eq(cartItems.productId, input.productId)
          )
        );
    }),

  remove: customerProcedure.input(productInput).mutation(async ({ ctx, input }) => {
    await ctx.db
      .delete(cartItems)
      .where(
        and(
          eq(cartItems.userId, ctx.user.id),
          eq(cartItems.productId, input.productId)
        )
      );
  }),

  clear: customerProcedure.mutation(async ({ ctx }) => {
    await ctx.db.delete(cartItems).where(eq(cartItems.userId, ctx.user.id));
  }),
});
