import { sql } from "drizzle-orm";
import { check, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export type BankAccount = { bank: string; number: string; holder: string };

export const storeSettings = pgTable(
  "store_settings",
  {
    id: integer().primaryKey().default(1),
    bankAccounts: jsonb("bank_accounts")
      .$type<BankAccount[]>()
      .notNull()
      .default([]),
    address: text().notNull().default(""),
    phone: text().notNull().default(""),
    openingHours: text("opening_hours").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [check("store_settings_singleton", sql`${t.id} = 1`)]
);
