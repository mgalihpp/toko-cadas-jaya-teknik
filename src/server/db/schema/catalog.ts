import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { conditionEnum, timestamps } from "./shared";

export const categories = pgTable("categories", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  ...timestamps,
});

export const products = pgTable(
  "products",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    slug: text().notNull().unique(),
    description: text().notNull().default(""),
    specs: jsonb().$type<Record<string, string>>().notNull().default({}),
    price: integer().notNull(),
    condition: conditionEnum().notNull(),
    stockPhysical: integer("stock_physical").notNull().default(0),
    stockLocked: integer("stock_locked").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    ...timestamps,
  },
  (t) => [
    index("products_category_idx").on(t.categoryId),
    index("products_active_idx").on(t.isActive),
    check("products_price_positive", sql`${t.price} > 0`),
    check(
      "products_stock_valid",
      sql`${t.stockPhysical} >= 0 AND ${t.stockLocked} >= 0 AND ${t.stockLocked} <= ${t.stockPhysical}`
    ),
  ]
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text().notNull(),
    fileKey: text("file_key"),
    position: integer().notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId)]
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer().notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("cart_items_user_product_idx").on(t.userId, t.productId),
    check("cart_items_quantity_positive", sql`${t.quantity} > 0`),
  ]
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));
