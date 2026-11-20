import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { db } from "@/server/db";
import { productImages, products } from "@/server/db/schema";

// Pemakaian: bun scripts/upload-product-images.ts <folder>
// Nama file di folder: <slug-produk>-<urutan>.jpg (urutan mulai 0).
const dir = process.argv[2];
if (!dir) throw new Error("Berikan folder gambar: bun scripts/upload-product-images.ts <folder>");

const utapi = new UTApi();

async function main() {
  const files = (await readdir(dir)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  const bySlug = new Map<string, { file: string; position: number }[]>();
  for (const file of files) {
    const m = file.match(/^(.*)-(\d+)\.\w+$/);
    if (!m) continue;
    const list = bySlug.get(m[1]) ?? [];
    list.push({ file, position: Number(m[2]) });
    bySlug.set(m[1], list);
  }

  for (const [slug, items] of bySlug) {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    if (!product) {
      console.warn(`Lewati ${slug}: produk tidak ditemukan`);
      continue;
    }
    items.sort((a, b) => a.position - b.position);

    const uploaded: { url: string; key: string; position: number }[] = [];
    for (const { file, position } of items) {
      const buf = await readFile(join(dir, file));
      const type = /\.png$/i.test(file) ? "image/png" : /\.webp$/i.test(file) ? "image/webp" : "image/jpeg";
      const res = await utapi.uploadFiles(new File([buf], file, { type }));
      if (res.error) throw new Error(`Upload ${file} gagal: ${res.error.message}`);
      uploaded.push({ url: res.data.ufsUrl, key: res.data.key, position });
    }

    const old = await db.select().from(productImages).where(eq(productImages.productId, product.id));
    await db.delete(productImages).where(eq(productImages.productId, product.id));
    await db.insert(productImages).values(
      uploaded.map((u) => ({ productId: product.id, url: u.url, fileKey: u.key, position: u.position }))
    );
    const oldKeys = old.map((o) => o.fileKey).filter((k): k is string => !!k);
    if (oldKeys.length) await utapi.deleteFiles(oldKeys);
    console.log(`${product.name}: ${uploaded.length} gambar`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
