import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  catalogHref,
  CONTAINER,
  ProductCard,
  ProductCardSkeleton,
  ProductImage,
} from "@/features/catalog";
import { cn } from "@/lib/utils";
import { getCategories, getLatestProducts } from "../data";
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
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-2 sm:grid sm:min-w-0 sm:grid-cols-4 sm:gap-y-6 lg:grid-cols-8">
        {categories.map((category) => {
          const Icon = categoryIcon(category.slug, category.icon);
          const photoClass =
            "size-[88px] rounded-full border border-ink-200 transition-colors group-hover:border-brand-500 lg:size-[100px]";
          return (
            <li key={category.id} className="w-28 sm:w-auto">
              <Link
                href={catalogHref({ categorySlug: category.slug })}
                className="group flex flex-col items-center gap-2.5 text-center"
              >
                {category.image ? (
                  <ProductImage
                    src={category.image}
                    alt=""
                    className={photoClass}
                  />
                ) : (
                  <span
                    className={cn(
                      photoClass,
                      "flex items-center justify-center bg-brand-50 group-hover:bg-brand-100",
                    )}
                  >
                    <Icon className="size-9 text-brand-600" strokeWidth={1.5} />
                  </span>
                )}
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-ink-900">
                    {category.name}
                  </span>
                  <span className="text-xs text-ink-500">
                    {Number(category.productCount)} produk
                  </span>
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
    <div className="grid grid-cols-4 gap-y-6 lg:grid-cols-8" aria-hidden>
      {Array.from({ length: MAX_CATEGORIES }, (_, i) => (
        <div key={i} className="flex flex-col items-center gap-2.5">
          <Skeleton className="size-[88px] rounded-full bg-ink-100 lg:size-[100px]" />
          <Skeleton className="h-4 w-16 bg-ink-200" />
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
        Produk sedang kami siapkan. Cek lagi sebentar lagi, atau hubungi toko.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function LatestProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {Array.from({ length: 12 }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}


