import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { products } from "./catalog";
import {
  fulfillmentEnum,
  orderStatusEnum,
  paymentMethodEnum,
  paymentStatusEnum,
  stockReasonEnum,
  timestamps,
} from "./shared";

export const orders = pgTable(
  "orders",
  {
    id: uuid().primaryKey().defaultRandom(),
    code: text().notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    recipientName: text("recipient_name").notNull(),
    phone: text().notNull(),
    fulfillment: fulfillmentEnum().notNull(),
    address: text(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    status: orderStatusEnum().notNull().default("menunggu_pembayaran"),
    total: integer().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("orders_user_idx").on(t.userId),
    index("orders_status_idx").on(t.status),
    index("orders_created_idx").on(t.createdAt),
    check("orders_total_nonnegative", sql`${t.total} >= 0`),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    productName: text("product_name").notNull(),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer().notNull(),
  },
  (t) => [
    index("order_items_order_idx").on(t.orderId),
    index("order_items_product_idx").on(t.productId),
    check("order_items_quantity_positive", sql`${t.quantity} > 0`),
  ]
);

export const payments = pgTable(
  "payments",
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    method: paymentMethodEnum().notNull(),
    amount: integer().notNull(),
    proofUrl: text("proof_url"),
    proofKey: text("proof_key"),
    status: paymentStatusEnum().notNull().default("menunggu"),
    ownerNote: text("owner_note"),
    confirmedBy: text("confirmed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("payments_order_idx").on(t.orderId)]
);

export const orderStatusLogs = pgTable(
  "order_status_logs",
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: orderStatusEnum("from_status"),
    toStatus: orderStatusEnum("to_status").notNull(),
    actorId: text("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    note: text(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("order_status_logs_order_idx").on(t.orderId)]
);

export const stockLogs = pgTable(
  "stock_logs",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    change: integer().notNull(),
    reason: stockReasonEnum().notNull(),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    actorId: text("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    note: text(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("stock_logs_product_idx").on(t.productId)]
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
  payments: many(payments),
  statusLogs: many(orderStatusLogs),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const orderStatusLogsRelations = relations(
  orderStatusLogs,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderStatusLogs.orderId],
      references: [orders.id],
    }),
  })
);

export const stockLogsRelations = relations(stockLogs, ({ one }) => ({
  product: one(products, {
    fields: [stockLogs.productId],
    references: [products.id],
  }),
}));
