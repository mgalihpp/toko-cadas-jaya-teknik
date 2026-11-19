# Arsitektur Folder

```
src/
  app/                      Rute Next.js (App Router) dan route handler
    api/auth/[...all]/      Handler Better Auth
    api/trpc/[trpc]/        Handler tRPC
  (store)/                  Grup rute sisi pelanggan (header + footer toko)
  (auth)/                   Masuk dan daftar customer
  (admin)/admin/            Panel admin; (panel)/ berlayout sidebar, masuk/ tanpa sidebar
  components/ui/            Komponen shadcn (hasil generate, jangan diedit kecuali perlu)
  components/layout/        Kerangka halaman: header toko, footer, shell admin
  components/shared/        Komponen lintas fitur (mis. EmptyState, PageHeader)
  features/<nama>/          Satu folder per fitur
    components/             Komponen khusus fitur
    hooks/                  Hook fitur (pembungkus tRPC query/mutation)
    schemas.ts              Skema zod form (bila ada)
    index.ts                API publik fitur; fitur lain hanya impor dari sini
  hooks/                    Hook React sisi klien
  lib/                      Util yang aman dipakai di klien dan server
    auth-client.ts          Klien Better Auth
    slug.ts, utils.ts
  trpc/                     Sambungan tRPC di sisi React
    client.tsx              TRPCReactProvider, useTRPC
    server.tsx              trpc, prefetch, HydrateClient untuk Server Component
    query-client.ts         QueryClient + serialisasi superjson
  server/                   Kode yang hanya jalan di server
    auth.ts                 Konfigurasi Better Auth
    db/
      index.ts              Koneksi Drizzle dan tipe Db
      helpers.ts            Ekspresi SQL dan fungsi bantu bersama
      schema/               Skema dibagi per domain
        shared.ts           Enum dan kolom timestamp
        auth.ts             Dihasilkan CLI Better Auth (bun run auth:schema)
        catalog.ts          categories, products, product_images, cart_items
        orders.ts           orders, order_items, payments, order_status_logs, stock_logs
        settings.ts         store_settings
        index.ts            Re-export semua
    services/
      orders.ts             Aturan stok dan status pesanan (kunci, lepas, jual, kedaluwarsa)
    api/
      trpc.ts               initTRPC, context, prosedur publik/authed/customer/admin
      root.ts               appRouter dan tipe AppRouter
      routers/
        catalog.ts, cart.ts, orders.ts, settings.ts
        admin/              categories, products, stock, orders, finance
  proxy.ts                  Pengalihan awal berdasarkan cookie sesi
scripts/
  seed.ts                   Admin awal, kategori, pengaturan toko
  verify-flow.ts            Uji alur pesanan terhadap database lokal
drizzle/                    Migrasi hasil drizzle-kit
docs/                       Dokumentasi teknologi dan arsitektur
```

## Aturan dependensi

- `app/**/page.tsx` tipis: ambil data awal bila perlu, lalu render komponen dari `features/<nama>`.
- Fitur tidak mengimpor isi dalam fitur lain, hanya lewat `features/<nama>/index.ts`.

- `app` dan `components` boleh memakai `trpc/` dan `lib/`. Jangan mengimpor `server/` dari komponen klien.
- `server/api/routers` memanggil `server/services` untuk aturan bisnis yang dipakai lebih dari satu router, dan `server/db` untuk query.
- `server/services` dan `server/db` tidak mengimpor `server/api`.
- Router tipis: validasi input dengan zod, cek hak akses lewat prosedur, lalu query atau panggil service.

## Perintah

| Perintah | Fungsi |
|---|---|
| `bun run db:generate` | Buat migrasi dari perubahan skema |
| `bun run db:migrate` | Terapkan migrasi |
| `bun run db:seed` | Isi admin, kategori, dan pengaturan toko |
| `bun run db:studio` | Buka Drizzle Studio |
| `bun run auth:schema` | Buat ulang `schema/auth.ts` setelah mengubah `server/auth.ts` |
| `bun run verify` | Jalankan uji alur pesanan (menulis lalu membersihkan data di database lokal) |
| `bun run typecheck` | Cek tipe |
