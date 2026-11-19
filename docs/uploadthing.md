# UploadThing

Sumber: Context7 `/pingdotgg/uploadthing` (docs.uploadthing.com). Dipakai untuk penyimpanan berkas (gambar produk, bukti pembayaran). PRD menyebut "disk server atau penyimpanan objek"; UploadThing termasuk opsi penyimpanan objek terkelola, jadi tidak bergantung pada disk hosting.

## Environment

```
UPLOADTHING_TOKEN=...
```

## FileRouter

```ts
// app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const ourFileRouter = {
  productImage: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
    .middleware(async ({ req }) => {
      // berjalan di server sebelum upload: cek sesi dan peran admin
      const user = await getUser(req); // ganti dengan getSession Better Auth
      if (!user) throw new UploadThingError("Unauthorized"); // throw = upload ditolak
      return { userId: user.id }; // tersedia sebagai `metadata`
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // berjalan di server setelah upload: simpan file.ufsUrl / file.key ke database
      console.log("Upload oleh", metadata.userId, file.ufsUrl);
      return { uploadedBy: metadata.userId }; // dikirim ke onClientUploadComplete
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```

Tipe berkas lain: `pdf: { maxFileSize: "16MB", maxFileCount: 1 }`, `video`, dan kombinasi beberapa tipe dalam satu route. Validasi input tambahan lewat `.input(z.object({...}))`, nilainya tersedia di `middleware`.

Sumber: https://docs.uploadthing.com/file-routes

## Route handler (App Router)

```ts
// app/api/uploadthing/route.ts
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  // config: { token: process.env.UPLOADTHING_TOKEN },
});
```

Sumber: https://docs.uploadthing.com/getting-started/appdir

## Komponen React

Buat helper bertipe satu kali:

```ts
// utils/uploadthing.ts
import {
  generateReactHelpers,
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
export const { useUploadThing } = generateReactHelpers<OurFileRouter>();
```

Pemakaian:

```tsx
"use client";
import { UploadButton } from "@/utils/uploadthing";

export default function Page() {
  return (
    <UploadButton
      endpoint="productImage"
      onClientUploadComplete={(res) => console.log("Files:", res)}
      onUploadError={(error: Error) => alert(`ERROR! ${error.message}`)}
      onUploadProgress={(p) => console.log(`${p}%`)}
    />
  );
}
```

Hook `useUploadThing("endpoint", { onClientUploadComplete, onUploadError })` mengembalikan `startUpload(files)`, `isUploading`, dan `permittedFileInfo` bila butuh UI kustom.

Bentuk respons klien: `{ name, size, key, url, customId, serverData }`. `serverData` bernilai `null` kecuali opsi `awaitServerData` aktif. Kode contoh di dokumentasi memakai `file.ufsUrl` di server.

Sumber: https://docs.uploadthing.com/api-reference/react

## Hapus berkas (server)

```ts
import { UTApi } from "uploadthing/server";
export const utapi = new UTApi();

await utapi.deleteFiles("2e0fdb64-..._image.jpg");
await utapi.deleteFiles(["key-1", "key-2"]);
await utapi.deleteFiles("myCustomIdentifier", { keyType: "customId" });
```

Simpan `file.key` di database agar berkas bisa dihapus saat produk atau bukti pembayaran dihapus.

Sumber: https://docs.uploadthing.com/api-reference/ut-api
