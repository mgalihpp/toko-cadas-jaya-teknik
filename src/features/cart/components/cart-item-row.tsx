"use client";

import { ImageIcon, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { ConditionBadge } from "@/features/catalog";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCartMutations } from "../hooks/use-cart";
import { maxQuantity, stockState, type CartItem } from "../lib";

const stockTone = {
  habis: "text-error",
  kurang: "text-error",
  terakhir: "text-warning",
  tersedia: "text-success",
} as const;

export function ProductThumb({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink-100 text-ink-500",
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : (
        <ImageIcon className="size-6" aria-hidden />
      )}
    </div>
  );
}

export function CartItemRow({ item }: { item: CartItem }) {
  const { setQuantity, remove } = useCartMutations();
  const stock = stockState(item);
  const unavailable = stock.kind === "habis";
  const max = maxQuantity(item);
  const busy =
    (setQuantity.isPending && setQuantity.variables?.productId === item.productId) ||
    (remove.isPending && remove.variables?.productId === item.productId);

  const change = (quantity: number) =>
    setQuantity.mutate({ productId: item.productId, quantity });

  return (
    <li
      className={cn(
        "grid grid-cols-[80px_1fr_auto] items-start gap-x-4 gap-y-3 border-b border-border py-5 sm:grid-cols-[112px_1fr_auto_auto_auto] sm:items-center sm:gap-5 sm:py-6",
        busy && "opacity-60"
      )}
    >
      <Link href={`/produk/${item.slug}`} className="row-span-2 sm:row-span-1">
        <ProductThumb
          src={item.image}
          alt={item.name}
          className={cn("size-20 sm:size-28", unavailable && "grayscale")}
        />
      </Link>

      <div className="flex min-w-0 flex-col gap-2">
        <ConditionBadge condition={item.condition} className="w-fit" />
        <Link
          href={`/produk/${item.slug}`}
          className={cn(
            "font-semibold leading-snug hover:underline",
            unavailable ? "text-ink-500" : "text-ink-900"
          )}
        >
          {item.name}
        </Link>
        <p className={cn("text-[13px] font-medium", stockTone[stock.kind])}>{stock.label}</p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-label={`Hapus ${item.name} dari keranjang`}
        disabled={busy}
        onClick={() => remove.mutate({ productId: item.productId })}
        className={cn(
          "col-start-3 row-start-1 sm:col-start-5",
          unavailable
            ? "bg-error-soft text-error hover:bg-error-soft/80 hover:text-error"
            : "text-ink-500"
        )}
      >
        <Trash2 className="size-[18px]" />
      </Button>

      <div className="col-span-2 col-start-2 flex items-center justify-between gap-4 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:contents">
        <div
          className={cn(
            "flex h-9 w-[108px] items-center rounded-lg border border-border",
            unavailable && "pointer-events-none opacity-50"
          )}
        >
          <button
            type="button"
            aria-label="Kurangi jumlah"
            className="flex h-full w-9 items-center justify-center text-ink-700 disabled:text-ink-300"
            disabled={busy || unavailable || item.quantity <= 1}
            onClick={() => change(Math.min(item.quantity - 1, max))}
          >
            <Minus className="size-3.5" />
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-ink-900" aria-live="polite">
            {item.quantity}
          </span>
          <button
            type="button"
            aria-label="Tambah jumlah"
            className="flex h-full w-9 items-center justify-center text-ink-700 disabled:text-ink-300"
            disabled={busy || unavailable || item.quantity >= max}
            onClick={() => change(item.quantity + 1)}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <p
          className={cn(
            "text-right text-base font-bold sm:min-w-32 sm:text-lg",
            unavailable ? "text-ink-500" : "text-ink-900"
          )}
        >
          {formatRupiah(item.price * item.quantity)}
        </p>
      </div>
    </li>
  );
}
