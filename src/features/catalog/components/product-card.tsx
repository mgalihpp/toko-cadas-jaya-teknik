import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Condition } from "../types";
import { ConditionBadge } from "./condition-badge";
import { ProductCardAddButton } from "./product-card-add-button";
import { ProductImage } from "./product-image";
import { stockLevel } from "./stock-indicator";

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

function MetaDot() {
  return <span aria-hidden className="size-[3px] shrink-0 rounded-full bg-ink-300" />;
}

function StockMeta({ available }: { available: number }) {
  const level = stockLevel(available);
  if (level === "habis") return <span className="shrink-0 font-semibold text-error">Habis</span>;
  if (level === "terakhir") {
    return <span className="shrink-0 font-semibold text-warning">Tersisa 1 unit</span>;
  }
  return <span className="shrink-0 text-success">Stok {available}</span>;
}

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

  return (
    <article
      className={cn(
        "@container group relative flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-background p-3 transition-colors hover:border-ink-300",
        className
      )}
    >
      <div className="relative overflow-hidden rounded-lg bg-ink-100">
        <ProductImage
          src={product.image}
          alt=""
          loading={priority ? "eager" : "lazy"}
          className={cn(
            "aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-[1.03]",
            soldOut && "opacity-45"
          )}
        />
        {used && (
          <ConditionBadge
            condition="bekas"
            className="absolute top-2 left-2 rounded-md px-2 py-[3px] text-[11px] font-bold"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-center gap-2 text-xs font-medium whitespace-nowrap text-ink-500">
          <span className="min-w-0 truncate">{product.categoryName}</span>
          {!used && (
            <>
              <MetaDot />
              <span className={cn("shrink-0 font-semibold", soldOut ? "text-ink-500" : "text-ink-900")}>
                Baru
              </span>
            </>
          )}
          <MetaDot />
          <StockMeta available={product.available} />
        </div>

        <h3 className="min-h-[2.625rem] font-sans text-[15px] leading-[1.4] font-semibold">
          <Link
            href={`/produk/${product.slug}`}
            className={cn(
              "line-clamp-2 outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50",
              soldOut ? "text-ink-500" : "text-ink-900 group-hover:text-brand-700"
            )}
          >
            {product.name}
          </Link>
        </h3>

        <span
          className={cn(
            "mt-auto pt-1 font-heading text-lg font-bold",
            soldOut ? "text-ink-500" : "text-ink-900"
          )}
        >
          {formatRupiah(product.price)}
        </span>
      </div>

      <ProductCardAddButton productId={product.id} name={product.name} soldOut={soldOut} />
    </article>
  );
}
