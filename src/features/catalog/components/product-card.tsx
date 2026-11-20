import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Condition } from "../types";
import { ProductCardAddButton } from "./product-card-add-button";
import { ProductImage } from "./product-image";
import { LIMITED_STOCK, stockLevel } from "./stock-indicator";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  condition: Condition;
  available: number;
  categoryName: string;
  image: string | null;
};

export function ProductCard({
  product,
  className,
  priority = false,
}: {
  product: ProductCardData;
  className?: string;
  priority?: boolean;
}) {
  const soldOut = product.available <= 0;
  const used = product.condition === "bekas";
  const limited =
    !soldOut && (stockLevel(product.available) === "terakhir" || product.available <= LIMITED_STOCK);

  return (
    <article
      className={cn(
        "@container group relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-xl border border-border bg-background transition-colors hover:border-ink-300",
        className
      )}
    >
      <div className="relative overflow-hidden bg-ink-100">
        <ProductImage
          src={product.image}
          alt=""
          loading={priority ? "eager" : "lazy"}
          className={cn(
            "aspect-[4/3] w-full object-contain",
            soldOut && "opacity-45"
          )}
        />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-3">
        <h3 className="min-h-[2.625rem] font-sans text-[15px] leading-[1.4] font-semibold">
          <Link
            href={`/produk/${product.slug}`}
            className={cn(
              "line-clamp-2 outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50",
              soldOut ? "text-ink-500" : "text-ink-900"
            )}
          >
            {product.name}
          </Link>
        </h3>

        <span
          className={cn(
            "mt-auto font-heading text-lg font-bold",
            soldOut ? "text-ink-500" : "text-brand-600"
          )}
        >
          {formatRupiah(product.price)}
        </span>

        {(used || limited) && (
          <div className="flex flex-wrap gap-1.5">
            {used && (
              <span className="rounded-md bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-700">
                Bekas
              </span>
            )}
            {limited && (
              <span className="rounded-md bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">
                Stok terbatas
              </span>
            )}
          </div>
        )}
      </div>

      <div className="px-3 pb-3">
        <ProductCardAddButton productId={product.id} name={product.name} soldOut={soldOut} />
      </div>
    </article>
  );
}
