"use client";

import { HeartIcon } from "lucide-react";
import Link from "next/link";
import { useFavoriteIds, useToggleFavorite } from "@/features/favorites";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Condition } from "../types";
import { ProductImage } from "./product-image";

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

const BADGE: Record<Condition | "habis", { label: string; className: string }> = {
  baru: { label: "Baru", className: "bg-brand-100 text-brand-700" },
  bekas: { label: "Bekas", className: "bg-warning-soft text-warning" },
  habis: { label: "Habis", className: "bg-ink-100 text-ink-500" },
};

export function ProductBadge({
  kind,
  className,
}: {
  kind: Condition | "habis";
  className?: string;
}) {
  const badge = BADGE[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-[3px] text-[11px] leading-[1.2] font-bold whitespace-nowrap",
        badge.className,
        className,
      )}
    >
      {badge.label}
    </span>
  );
}

export function FavoriteButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const favorites = useFavoriteIds();
  const toggle = useToggleFavorite();
  const active = favorites.has(productId);
  return (
    <button
      type="button"
      aria-label={active ? "Hapus dari favorit" : "Tambah ke favorit"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      className={cn(
        "relative z-10 flex size-8 items-center justify-center rounded-full bg-white/90",
        className,
      )}
    >
      <HeartIcon
        className={cn("size-[18px]", active ? "fill-error text-error" : "text-brand-700")}
        strokeWidth={2}
      />
    </button>
  );
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
        "relative flex min-w-0 flex-col overflow-hidden rounded-[10px] border border-ink-200 bg-white",
        className,
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-ink-100">
        <ProductImage
          src={product.image}
          alt=""
          loading={priority ? "eager" : "lazy"}
          className="size-full object-cover"
        />
        {soldOut ? (
          <span className="absolute inset-0 flex items-center justify-center bg-white/60">
            <span className="rounded-2xl bg-toast px-3 py-1.5 text-xs font-bold text-white">
              Stok habis
            </span>
          </span>
        ) : null}
        <FavoriteButton productId={product.id} className="absolute top-2 right-2" />
        <ProductBadge
          kind={soldOut ? "habis" : product.condition}
          className="absolute top-2 left-2"
        />
      </div>
      <div className="flex flex-col gap-1 p-2.5">
        <h3 className="line-clamp-2 min-h-[2.6em] text-[13px] leading-[1.35] font-normal text-ink-900">
          <Link
            href={`/produk/${product.slug}`}
            className="outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {product.name}
          </Link>
        </h3>
        <p className={cn("text-base leading-[1.35] font-bold", soldOut ? "text-ink-500" : "text-brand-700")}>
          {formatRupiah(product.price)}
        </p>
        {soldOut ? null : (
          <p className={cn("text-xs leading-[1.35] font-medium", used ? "text-warning" : "text-ink-500")}>
            {used ? `Sisa ${product.available} unit` : `Stok ${product.available}`}
          </p>
        )}
      </div>
    </article>
  );
}
