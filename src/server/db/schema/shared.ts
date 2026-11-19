import { pgEnum, timestamp } from "drizzle-orm/pg-core";

export const conditionEnum = pgEnum("condition", ["baru", "bekas"]);
export const fulfillmentEnum = pgEnum("fulfillment", ["kirim", "ambil"]);
export const paymentMethodEnum = pgEnum("payment_method", ["tunai", "transfer"]);
export const orderStatusEnum = pgEnum("order_status", [
  "menunggu_pembayaran",
  "menunggu_konfirmasi",
  "dibayar",
  "diproses",
  "selesai",
  "dibatalkan",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "menunggu",
  "diterima",
  "ditolak",
]);
export const stockReasonEnum = pgEnum("stock_reason", [
  "penyesuaian",
  "kunci",
  "lepas",
  "terjual",
]);

export const ORDER_STATUSES = orderStatusEnum.enumValues;
export const CONDITIONS = conditionEnum.enumValues;

export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
