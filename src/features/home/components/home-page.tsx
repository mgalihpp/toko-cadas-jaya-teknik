import { LayoutGridIcon, MoreHorizontalIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { catalogHref, ProductCard } from "@/features/catalog";
import { getCategories, getLatestProducts, getUsedPicks } from "../data";
import { categoryIcon } from "./category-icon";
import { HeroBanner } from "./hero-banner";
import { HomeHeader, HomeNotice } from "./home-header";

const MAX_CATEGORIES = 8;
const FEATURED = 6;

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-[13px] font-bold text-brand-600">
      {children}
    </Link>
  );
}

function Tile({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1.5">
      <span className="flex size-[52px] items-center justify-center rounded-2xl bg-brand-100">
        {children}
      </span>
      <span className="line-clamp-1 w-full text-center text-xs font-medium text-ink-900">{label}</span>
    </Link>
  );
}

export async function HomePage() {
  const [categories, latest, used] = await Promise.all([
    getCategories(),
    getLatestProducts(),
    getUsedPicks(),
  ]);
  const shown = categories.slice(0, MAX_CATEGORIES);
  const featured = latest.filter((p) => p.condition === "baru").slice(0, FEATURED);
  const featuredIds = new Set(featured.map((p) => p.id));
  const recommended = latest.filter((p) => !featuredIds.has(p.id)).slice(0, 6);
  const heroImages = latest.flatMap((p) => (p.image ? [p.image] : [])).slice(0, 3);

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-30">
        <HomeNotice />
        <HomeHeader />
      </div>
      <HeroBanner images={heroImages} />

      <section aria-label="Kategori" className="grid grid-cols-5 gap-y-3 bg-white px-2 py-3.5">
        <Tile href="/produk" label="Semua">
          <LayoutGridIcon className="size-6 text-brand-600" strokeWidth={1.8} />
        </Tile>
        {shown.map((category) => {
          const Icon = categoryIcon(category.slug, category.icon);
          return (
            <Tile
              key={category.id}
              href={catalogHref({ categorySlug: category.slug })}
              label={category.name}
            >
              <Icon className="size-6 text-brand-600" strokeWidth={1.8} />
            </Tile>
          );
        })}
        {categories.length > MAX_CATEGORIES ? (
          <Tile href="/produk" label="Lainnya">
            <MoreHorizontalIcon className="size-6 text-brand-600" strokeWidth={1.8} />
          </Tile>
        ) : null}
      </section>

      {featured.length > 0 ? (
        <>
          <div className="h-2" />
          <section className="flex flex-col gap-2.5 bg-white py-3">
            <div className="flex items-center gap-2 px-3">
              <h2 className="flex-1 text-base font-bold text-ink-900">Unggulan minggu ini</h2>
              <SectionLink href={catalogHref({ condition: "baru" })}>Semua</SectionLink>
            </div>
            <div className="cjt-no-scrollbar flex gap-2.5 overflow-x-auto px-3">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} className="w-[138px] shrink-0" />
              ))}
            </div>
          </section>
        </>
      ) : null}

      {used.items.length > 0 ? (
        <>
          <div className="h-2" />
          <section className="flex flex-col gap-2.5 bg-warning-soft py-3">
            <div className="flex items-center gap-1.5 px-3">
              <TriangleAlertIcon className="size-[18px] text-warning" strokeWidth={2} />
              <h2 className="flex-1 text-base font-bold text-warning">Barang bekas, jumlah terbatas</h2>
              <SectionLink href={catalogHref({ condition: "bekas" })}>Semua</SectionLink>
            </div>
            <div className="cjt-no-scrollbar flex gap-2.5 overflow-x-auto px-3">
              {used.items.map((product) => (
                <ProductCard key={product.id} product={product} className="w-[138px] shrink-0" />
              ))}
            </div>
          </section>
        </>
      ) : null}

      {recommended.length > 0 ? (
        <>
          <div className="h-2" />
          <section className="bg-white">
            <h2 className="sticky top-[100px] z-20 border-b-2 border-brand-600 bg-white py-3 text-center text-base font-bold text-brand-600">
              Rekomendasi
            </h2>
            <div className="grid grid-cols-2 gap-2.5 p-3">
              {recommended.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        </>
      ) : null}

      {latest.length === 0 && used.items.length === 0 ? (
        <p className="m-3 rounded-xl border border-dashed border-ink-300 bg-white px-6 py-12 text-center text-sm text-ink-500">
          Produk sedang kami siapkan. Cek lagi sebentar lagi, atau hubungi toko.
        </p>
      ) : null}
    </div>
  );
}
