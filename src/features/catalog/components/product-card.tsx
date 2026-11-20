import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Condition } from "../types";
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
    <article className={cn("@container group relative flex min-w-0 flex-col gap-2.5", className)}>
      <div className="relative overflow-hidden rounded-xl bg-ink-100">
        <ProductImage
          src={product.image}
          alt=""
          loading={priority ? "eager" : "lazy"}
          className={cn("aspect-square w-full object-cover", soldOut && "opacity-45")}
        />
        {soldOut && (
          <span className="absolute top-2 left-2 rounded-md bg-ink-900 px-2 py-0.5 text-xs font-semibold text-white">
            Stok habis
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-sans text-sm leading-snug font-normal">
          <Link
            href={`/produk/${product.slug}`}
            className={cn(
              "line-clamp-1 outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50",
              soldOut ? "text-ink-500" : "text-ink-900"
            )}
          >
            {product.name}
          </Link>
        </h3>

        <span
          className={cn(
            "font-heading text-base font-bold",
            soldOut ? "text-ink-500" : "text-ink-900"
          )}
        >
          {formatRupiah(product.price)}
        </span>

        {(used || limited) && (
          <div className="mt-0.5 flex flex-wrap gap-1.5">
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
    </article>
  );
}
