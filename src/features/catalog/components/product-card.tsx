import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Condition } from "../types";
import { ConditionBadge } from "./condition-badge";
import { ProductImage } from "./product-image";
import { StockIndicator } from "./stock-indicator";

export type ProductCardData = {
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
  return (
    <Link
      href={`/produk/${product.slug}`}
      className={cn(
        "group flex min-w-0 flex-col gap-3.5 rounded-[14px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      <div className="relative overflow-hidden rounded-[14px]">
        <ProductImage
          src={product.image}
          alt={product.name}
          loading={priority ? "eager" : "lazy"}
          className={cn(
            "aspect-[15/13] w-full transition-transform duration-300 group-hover:scale-[1.03]",
            soldOut && "opacity-55"
          )}
        />
        <ConditionBadge condition={product.condition} className="absolute top-3 left-3" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-ink-500">{product.categoryName}</span>
        <h3 className="line-clamp-2 font-sans text-[15px] leading-snug font-semibold text-ink-900 group-hover:text-brand-700">
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span
            className={cn(
              "font-heading text-lg font-bold sm:text-[19px]",
              soldOut ? "text-ink-500" : "text-ink-900"
            )}
          >
            {formatRupiah(product.price)}
          </span>
          <StockIndicator available={product.available} />
        </div>
      </div>
    </Link>
  );
}
