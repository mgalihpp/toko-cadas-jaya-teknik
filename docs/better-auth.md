# Better Auth

Sumber: Context7 `/better-auth/better-auth` (better-auth.com/docs). Dipakai untuk autentikasi sesi berbasis cookie dengan peran customer dan admin (PRD bagian 11).

## Handler API di Next.js App Router

```ts
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

Sumber: https://www.better-auth.com/docs/integrations/next

## Email dan kata sandi

```ts
// lib/auth.ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
});
```

Sumber: https://www.better-auth.com/docs/authentication/email-password

## Adapter Drizzle dan pembuatan skema

CLI membuat skema tabel yang dibutuhkan Better Auth dalam format ORM yang dipakai:

```bash
npx auth@latest generate
npx auth generate --adapter drizzle     # tanpa perlu adapter terkonfigurasi
```

Opsi: `--config <path>`, `--output <file>`, `--dialect postgresql` (untuk Drizzle dipetakan ke `pg`), `-y`.

Setelah skema dihasilkan, jalankan `drizzle-kit generate` lalu `drizzle-kit migrate` (lihat `drizzle-orm.md`).

Konfigurasi `drizzleAdapter` tidak muncul di potongan dokumentasi yang diambil. Bentuk yang umum dipakai adalah `database: drizzleAdapter(db, { provider: "pg" })` dari `better-auth/adapters/drizzle`; **cek di https://www.better-auth.com/docs/adapters/drizzle sebelum dipakai**.

Sumber: https://www.better-auth.com/docs/concepts/cli

## Field tambahan pada user (mis. `role`)

Field tambahan dapat dideklarasikan pada skema user (`type`: `string | number | boolean | date`, `required`, `unique`, `defaultValue`). Setelah itu field ikut tersedia pada request sign-up dan objek user:

```ts
const res = await auth.api.signUpEmail({
  body: { email: "a@b.com", password: "password", name: "Budi", lang: "fr" },
});
res.user.role; // "user"
```

Sumber: https://www.better-auth.com/docs/concepts/database

## Proteksi halaman dan rute

Di Server Component (pengecekan sesi yang sebenarnya):

```tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  // cek session.user.role === "admin" di sini
  return <h1>Halo {session.user.name}</h1>;
}
```

Di middleware, pilihan bergantung versi Next.js:

- **Next.js 15.2.0+**: middleware boleh memakai runtime Node.js sehingga bisa memanggil `auth.api.getSession` penuh (eksperimental sebelum Next.js 16).

```ts
export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.redirect(new URL("/sign-in", request.url));
  return NextResponse.next();
}
export const config = {
  runtime: "nodejs",
  matcher: ["/admin"],
};
```

- **Next.js 15.1.7 ke bawah** (Edge Runtime, tanpa akses database): ambil sesi lewat `betterFetch("/api/auth/get-session", { baseURL: request.nextUrl.origin, headers: { cookie } })`.

Catatan: dokumentasi Next.js terbaru menamai file ini `proxy.ts` (lihat `nextjs.md`). Tetap lakukan pengecekan peran admin di route handler / Server Component, jangan hanya di proxy.

Plugin `admin` (peran dan izin) tidak ikut terambil dalam pencarian ini; lihat https://www.better-auth.com/docs/plugins/admin bila dibutuhkan.

Sumber: https://www.better-auth.com/docs/integrations/next
