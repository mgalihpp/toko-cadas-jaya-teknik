# Drizzle ORM (PostgreSQL)

Sumber: Context7 `/websites/orm_drizzle_team` (orm.drizzle.team). Dipakai sebagai ORM, juga menjawab kebutuhan PRD soal pencegahan SQL injection lewat query berparameter.

## Koneksi (node-postgres)

```ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle(process.env.DATABASE_URL!);
```

Sumber: https://orm.drizzle.team/docs/get-started/postgresql-new

## Deklarasi skema

```ts
import { pgEnum, pgTable as table } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const rolesEnum = pgEnum("roles", ["guest", "user", "admin"]);

export const users = table(
  "users",
  {
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    email: t.varchar().notNull(),
    role: rolesEnum().default("guest"),
  },
  (table) => [t.uniqueIndex("email_idx").on(table.email)]
);

export const posts = table(
  "posts",
  {
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    title: t.varchar({ length: 256 }),
    ownerId: t.integer("owner_id").references(() => users.id),
  },
  (table) => [t.index("title_idx").on(table.title)]
);
```

Tipe kolom yang relevan untuk toko: `numeric("harga", { precision: 12, scale: 2 })` (uang, nilai dikembalikan sebagai string), `integer`, `boolean`, `text`, `varchar`, `jsonb`, `timestamp("...", { withTimezone: true }).defaultNow()`.

```ts
export const moodEnum = pgEnum("mood", ["sad", "ok", "happy"]);
```

Sumber: https://orm.drizzle.team/docs/sql-schema-declaration , https://orm.drizzle.team/docs/column-types

## Transaksi

`db.transaction` menjalankan beberapa statement sebagai satu unit; error apa pun membatalkan semuanya. `tx.rollback()` melempar exception yang membatalkan transaksi. Callback boleh mengembalikan nilai.

```ts
import { sql, eq } from "drizzle-orm";

const newBalance = await db.transaction(async (tx) => {
  const [account] = await tx
    .select({ balance: accounts.balance })
    .from(accounts)
    .where(eq(accounts.name, "Dan"));

  if (account.balance < 100) {
    tx.rollback(); // batalkan seluruh transaksi
  }

  await tx
    .update(accounts)
    .set({ balance: sql`${accounts.balance} - 100.00` })
    .where(eq(accounts.name, "Dan"));

  return account.balance;
});
```

Untuk penguncian stok (PRD): ambil baris produk dengan `SELECT ... FOR UPDATE` di dalam transaksi, lalu kurangi stok. Penjelasan kunci baris ada di `postgresql.md`. Di Drizzle, penguncian baris dilakukan lewat `.for("update")` pada query select; **hal ini tidak ada di potongan dokumentasi yang diambil**, jadi cek dulu di https://orm.drizzle.team/docs/select sebelum dipakai.

Sumber: https://orm.drizzle.team/docs/transactions

## drizzle-kit: konfigurasi dan migrasi

```ts
// drizzle.config.ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

```bash
npx drizzle-kit generate   # buat file migrasi dari perubahan skema
npx drizzle-kit migrate    # terapkan migrasi ke database
```

Sumber: https://orm.drizzle.team/docs/drizzle-kit-generate , https://orm.drizzle.team/docs/drizzle-kit-migrate
