import { eq } from "drizzle-orm";
import { STORE_ADDRESS, STORE_OPENING_HOURS, STORE_PHONE } from "@/features/contact/store-location";
import { slugify } from "@/lib/slug";
import { db } from "@/server/db";
import { categories, productImages, products, storeSettings } from "@/server/db/schema";

type Mock = {
  name: string;
  category: string;
  condition: "baru" | "bekas";
  price: number;
  stock: number;
  description: string;
  specs: Record<string, string>;
  photos: number;
};

const PRODUCTS: Mock[] = [
  { name: "Bor Listrik 13mm", category: "Bor", condition: "baru", price: 450000, stock: 12, description: "Bor listrik 13mm untuk kayu, besi, dan tembok. Mock data.", specs: { Daya: "550 W", Chuck: "13 mm", Kecepatan: "0-3000 rpm" }, photos: 1 },
  { name: "Gerinda Tangan 4 Inci", category: "Gerinda", condition: "baru", price: 380000, stock: 8, description: "Gerinda tangan 4 inci untuk memotong dan menghaluskan. Mock data.", specs: { Daya: "720 W", Diameter: "100 mm" }, photos: 1 },
  { name: "Gerinda Tangan 4 Inci (Bekas)", category: "Gerinda", condition: "bekas", price: 210000, stock: 1, description: "Unit bekas terawat, berfungsi normal. Mock data.", specs: { Daya: "720 W", Diameter: "100 mm" }, photos: 3 },
  { name: "Mesin Sirkel 7 Inci", category: "Mesin Sirkel", condition: "baru", price: 890000, stock: 4, description: "Mesin sirkel untuk memotong kayu papan. Mock data.", specs: { Daya: "1200 W", Mata: "185 mm" }, photos: 1 },
  { name: "Mesin Serut Kayu", category: "Mesin Serut", condition: "bekas", price: 520000, stock: 1, description: "Mesin serut bekas, mata pisau baru diasah. Mock data.", specs: { Daya: "600 W", Lebar: "82 mm" }, photos: 3 },
  { name: "Trafo Las 450 Ampere", category: "Trafo Las", condition: "baru", price: 1350000, stock: 5, description: "Trafo las listrik untuk pekerjaan bengkel. Mock data.", specs: { Arus: "450 A", Tegangan: "220 V" }, photos: 1 },
  { name: "Kompresor Angin 1 HP", category: "Kompresor", condition: "baru", price: 2150000, stock: 3, description: "Kompresor angin tabung 50 liter. Mock data.", specs: { Daya: "1 HP", Tabung: "50 L" }, photos: 1 },
  { name: "Mesin Cutting Besi 14 Inci", category: "Mesin Cutting", condition: "bekas", price: 750000, stock: 2, description: "Mesin cutting besi bekas, kondisi baik. Mock data.", specs: { Daya: "2000 W", Mata: "355 mm" }, photos: 3 },
  { name: "Hammer Drill 26mm", category: "Hammer Drill", condition: "baru", price: 1250000, stock: 0, description: "Hammer drill untuk beton. Stok habis (mock data).", specs: { Daya: "800 W", Kapasitas: "26 mm" }, photos: 1 },
];

const img = (text: string) =>
  `https://placehold.co/800x600/f5f5f4/78716c/png?text=${encodeURIComponent(text)}`;

async function main() {
  await db
    .insert(storeSettings)
    .values({
      id: 1,
      bankAccounts: [{ bank: "BCA", number: "0000000000", holder: "Cadas Jaya Teknik (contoh)" }],
      address: STORE_ADDRESS,
      phone: STORE_PHONE,
      openingHours: STORE_OPENING_HOURS,
    })
    .onConflictDoUpdate({
      target: storeSettings.id,
      set: {
        bankAccounts: [{ bank: "BCA", number: "0000000000", holder: "Cadas Jaya Teknik (contoh)" }],
        address: STORE_ADDRESS,
        phone: STORE_PHONE,
        openingHours: STORE_OPENING_HOURS,
      },
    });

  const cats = await db.select().from(categories);
  for (const p of PRODUCTS) {
    const slug = slugify(p.name);
    const [exists] = await db.select().from(products).where(eq(products.slug, slug));
    if (exists) continue;
    const category = cats.find((c) => c.name === p.category);
    if (!category) throw new Error(`Kategori ${p.category} belum ada, jalankan db:seed dulu`);
    const [row] = await db
      .insert(products)
      .values({
        name: p.name,
        slug,
        description: p.description,
        specs: p.specs,
        price: p.price,
        condition: p.condition,
        stockPhysical: p.stock,
        categoryId: category.id,
      })
      .returning();
    await db.insert(productImages).values(
      Array.from({ length: p.photos }, (_, i) => ({
        productId: row.id,
        url: img(p.photos > 1 ? `${p.name} foto ${i + 1}` : p.name),
        position: i,
      }))
    );
  }
  console.log("Data mock siap (pengaturan toko + produk contoh)");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
