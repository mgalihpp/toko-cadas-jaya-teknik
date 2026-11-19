# Next.js (App Router)

Sumber: Context7 `/websites/nextjs` (nextjs.org/docs). Dipakai sebagai frontend sekaligus backend/API (PRD bagian 11).

## Route Handlers (`app/**/route.ts`)

Export fungsi per metode HTTP: `GET`, `HEAD`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`.
Jika `OPTIONS` tidak didefinisikan, Next.js membuatnya otomatis.

```ts
// app/api/products/route.ts
export async function GET() {
  return Response.json({ message: "Hello World" });
}
```

`NextRequest` memperluas Web `Request` dengan `cookies` dan `nextUrl`:

```ts
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
}
```

### Segmen dinamis

`params` adalah **Promise**, harus di-`await`:

```ts
// app/api/orders/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return Response.json({ id });
}

// Alternatif bertipe: RouteContext
export async function PATCH(_req: Request, ctx: RouteContext<"/api/orders/[id]">) {
  const { id } = await ctx.params;
}
```

Sumber: https://nextjs.org/docs/app/api-reference/file-conventions/route

## Proteksi rute: `proxy.ts` (sebelumnya `middleware.ts`)

Dokumentasi terbaru memakai nama `proxy.ts` dengan fungsi `proxy`. Better Auth masih menulis contoh dengan `middleware.ts` (lihat `better-auth.md`); cek versi Next.js yang dipasang dan pakai nama file yang sesuai.

```ts
import { NextResponse, NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const isAuthenticated = /* cek cookie sesi */ false;
  if (isAuthenticated) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: "/admin/:path*",
};
```

Catatan dari panduan autentikasi Next.js:
- Di proxy lakukan pengecekan **optimistik** saja (baca cookie, jangan query database), karena proxy berjalan juga pada prefetch.
- Pengecekan otorisasi yang sebenarnya dilakukan di route handler / Server Component / Data Access Layer.
- Matcher untuk mengecualikan API dan aset statis: `'/((?!api|_next/static|_next/image|.*\\.png$).*)'`.

Sumber: https://nextjs.org/docs/app/guides/redirecting , https://nextjs.org/docs/app/guides/authentication

## Server Components, data fetching, dan revalidasi

Server Component dapat berupa fungsi `async`. Request `fetch` identik dalam satu pohon komponen di-memoize; `fetch` tidak di-cache secara default.

```tsx
export default async function Page() {
  const data = await fetch("https://api.vercel.app/blog");
  const posts = await data.json();
  return <ul>{posts.map((p) => <li key={p.id}>{p.title}</li>)}</ul>;
}
```

Opsi cache per-fetch:

```tsx
await fetch(url, { cache: "force-cache" });
await fetch(url, { next: { revalidate: 3600 } });
```

Setelah mutasi (mis. ubah stok/produk), invalidasi cache halaman katalog:

```ts
"use server";
import { revalidatePath } from "next/cache";

export async function updateProduct(formData: FormData) {
  // cek sesi + peran admin, lalu ubah data
  revalidatePath("/produk");
}
```

Sumber: https://nextjs.org/docs/app/getting-started/fetching-data , https://nextjs.org/docs/app/getting-started/mutating-data , https://nextjs.org/docs/app/guides/caching-without-cache-components
