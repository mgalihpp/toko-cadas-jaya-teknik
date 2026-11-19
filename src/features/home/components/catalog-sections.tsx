import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  catalogHref,
  CONTAINER,
  ProductCard,
  ProductCardSkeleton,
  ProductImage,
} from "@/features/catalog";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getCategories, getLatestProducts, getUsedPicks } from "../data";
import { categoryIcon } from "./category-icon";

const MAX_CATEGORIES = 8;

export function SectionShell({
  className,
  children,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section className={cn(CONTAINER, className)} {...props}>
      {children}
    </section>
  );
}

export async function CategoryStrip() {
  const categories = (await getCategories()).slice(0, MAX_CATEGORIES);
  if (categories.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <ul className="flex min-w-max border-t border-l border-ink-200 sm:grid sm:min-w-0 sm:grid-cols-4 lg:grid-cols-8">
        {categories.map((category) => {
          const Icon = categoryIcon(category.slug);
          return (
            <li key={category.id} className="w-36 border-r border-b border-ink-200 sm:w-auto">
              <Link
                href={catalogHref({ categorySlug: category.slug })}
                className="group flex h-full flex-col gap-3.5 px-5 py-7 transition-colors hover:bg-brand-50"
              >
                <Icon className="size-7 text-ink-900 group-hover:text-brand-600" strokeWidth={1.75} />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-semibold text-ink-900">{category.name}</span>
                  <span className="text-xs text-ink-500">{Number(category.productCount)} produk</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CategoryStripSkeleton() {
  return (
    <div className="grid grid-cols-2 border border-ink-200 sm:grid-cols-4 lg:grid-cols-8" aria-hidden>
      {Array.from({ length: MAX_CATEGORIES }, (_, i) => (
        <div key={i} className="flex flex-col gap-3.5 px-5 py-7">
          <Skeleton className="size-7 bg-ink-100" />
          <Skeleton className="h-4 w-20 bg-ink-200" />
          <Skeleton className="h-3 w-14 bg-ink-100" />
        </div>
      ))}
    </div>
  );
}

export async function LatestProductsGrid() {
  const products = await getLatestProducts();
  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-ink-300 px-6 py-12 text-center text-sm text-ink-500">
        Belum ada produk. Produk baru akan tampil di sini saat toko menambahkannya.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function LatestProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export async function UsedPicks() {
  const used = await getUsedPicks();
  if (used.items.length === 0) return null;
  return (
    <SectionShell
      className="grid gap-8 pb-16 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-16 lg:pb-24"
      aria-labelledby="bekas-pilihan"
    >
      <div className="flex flex-col gap-4">
        <span className="text-xs font-bold tracking-wider text-brand-600">BEKAS PILIHAN</span>
        <h2 id="bekas-pilihan" className="text-3xl font-bold tracking-tight text-ink-900 lg:text-4xl">
          Satu unit, siapa cepat dia dapat.
        </h2>
        <p className="text-base text-ink-600">
          Unit bekas di bawah ini biasanya tinggal satu. Stok terkunci untukmu selama 24 jam setelah
          checkout transfer.
        </p>
        <Link
          href="/produk?kondisi=bekas"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
        >
          Semua barang bekas
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>
      <ul className="flex flex-col">
        {used.items.map((item) => {
          const soldOut = item.available <= 0;
          return (
            <li
              key={item.id}
              className="flex items-center gap-4 border-b border-ink-200 py-5 first:pt-0 sm:gap-6 sm:py-6 sm:first:pt-0"
            >
              <Link href={`/produk/${item.slug}`} className="shrink-0">
                <ProductImage
                  src={item.image}
                  alt={item.name}
                  className={cn("h-20 w-24 rounded-xl sm:h-24 sm:w-[120px]", soldOut && "opacity-55")}
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link
                    href={`/produk/${item.slug}`}
                    className={cn(
                      "line-clamp-2 text-base font-semibold hover:text-brand-700 sm:text-[17px]",
                      soldOut ? "text-ink-500" : "text-ink-900"
                    )}
                  >
                    {item.name}
                  </Link>
                  <span className="text-sm text-ink-600">
                    {soldOut
                      ? "Sudah dipesan pelanggan lain, tunggu unit berikutnya"
                      : `${item.categoryName}, ${item.available === 1 ? "tinggal 1 unit" : `${item.available} unit`}`}
                  </span>
                </div>
                <span
                  className={cn(
                    "font-heading text-lg font-bold sm:w-[150px] sm:text-xl",
                    soldOut ? "text-ink-500" : "text-ink-900"
                  )}
                >
                  {formatRupiah(item.price)}
                </span>
              </div>
              {soldOut ? (
                <span className="hidden shrink-0 rounded-full bg-error-soft px-2.5 py-1 text-xs font-semibold text-error sm:inline-flex">
                  Stok habis
                </span>
              ) : (
                <Button asChild className="hidden h-10 shrink-0 bg-ink-900 px-4 font-semibold hover:bg-ink-800 sm:inline-flex">
                  <Link href={`/produk/${item.slug}`}>Pesan</Link>
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </SectionShell>
  );
}
