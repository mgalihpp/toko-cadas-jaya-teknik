"use client";

import { CheckIcon, ImageIcon, MinusIcon, PlusIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { SwipeRow } from "@/components/mobile/swipe-row";
import { ProductBadge } from "@/features/catalog";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCartMutations } from "../hooks/use-cart";
import { maxQuantity, stockState, type CartItem } from "../lib";

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
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-100 text-ink-500",
        className,
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

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "flex size-[22px] shrink-0 items-center justify-center rounded-md border-2",
        checked ? "border-brand-600 bg-brand-600" : "border-ink-300 bg-white",
      )}
    >
      {checked ? <CheckIcon className="size-4 text-white" strokeWidth={3} /> : null}
    </button>
  );
}

export function CartItemRow({
  item,
  selected,
  onToggle,
  fulfillmentLabel,
  editing,
}: {
  item: CartItem;
  selected: boolean;
  onToggle: () => void;
  fulfillmentLabel: string;
  editing: boolean;
}) {
  const { setQuantity, remove } = useCartMutations();
  const stock = stockState(item);
  const unavailable = stock.kind === "habis";
  const max = maxQuantity(item);
  const busy =
    (setQuantity.isPending && setQuantity.variables?.productId === item.productId) ||
    (remove.isPending && remove.variables?.productId === item.productId);
  const change = (quantity: number) => setQuantity.mutate({ productId: item.productId, quantity });
  const doRemove = () => remove.mutate({ productId: item.productId });
  const stepBtn = "flex size-[34px] items-center justify-center disabled:text-ink-500 text-brand-700";

  return (
    <li className={cn("border-b border-ink-200 bg-white last:border-b-0", busy && "opacity-60")}>
      <SwipeRow
        actionWidth={84}
        actions={
          <button
            type="button"
            onClick={doRemove}
            aria-label={`Hapus ${item.name}`}
            className="flex flex-1 flex-col items-center justify-center gap-1 bg-error text-xs font-bold text-white"
          >
            <Trash2Icon className="size-5" />
            Hapus
          </button>
        }
      >
        <div className="flex items-center gap-2.5 p-3">
          <Checkbox checked={selected && !unavailable} onChange={onToggle} label={`Pilih ${item.name}`} />
          <Link href={`/produk/${item.slug}`}>
            <ProductThumb
              src={item.image}
              alt=""
              className={cn("size-[76px]", unavailable && "grayscale")}
            />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
            <Link
              href={`/produk/${item.slug}`}
              className={cn(
                "line-clamp-2 text-sm leading-[1.35] font-medium",
                unavailable ? "text-ink-500" : "text-ink-900",
              )}
            >
              {item.name}
            </Link>
            <div className="flex items-center gap-1.5">
              <ProductBadge kind={item.condition} />
              <span className="text-xs text-ink-500">{fulfillmentLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="flex-1 text-[15px] font-bold text-brand-700">{formatRupiah(item.price)}</p>
              {editing ? (
                <button
                  type="button"
                  onClick={doRemove}
                  aria-label={`Hapus ${item.name}`}
                  className="flex size-9 items-center justify-center rounded-lg border-[1.5px] border-error-border text-error"
                >
                  <Trash2Icon className="size-[18px]" />
                </button>
              ) : null}
              <div className="flex h-9 items-center overflow-hidden rounded-lg border-[1.5px] border-ink-200">
                <button
                  type="button"
                  aria-label="Kurangi jumlah"
                  className={stepBtn}
                  disabled={busy || unavailable || item.quantity <= 1}
                  onClick={() => change(item.quantity - 1)}
                >
                  <MinusIcon className="size-[18px]" strokeWidth={2} />
                </button>
                <span className="w-8 text-center text-[15px] font-bold text-ink-900" aria-live="polite">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  aria-label="Tambah jumlah"
                  className={stepBtn}
                  disabled={busy || unavailable || item.quantity >= max}
                  onClick={() => change(item.quantity + 1)}
                >
                  <PlusIcon className="size-[18px]" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </SwipeRow>
      {unavailable || stock.kind === "kurang" ? (
        <div className="mx-3 mb-3 flex gap-2.5 rounded-[10px] border border-error-border bg-error-soft px-2.5 py-2">
          <TriangleAlertIcon className="size-5 shrink-0 text-error" strokeWidth={2} />
          <p className="text-[13px] text-ink-900">{stock.label}</p>
        </div>
      ) : item.condition === "bekas" && item.available <= 1 ? (
        <div className="mx-3 mb-3 flex gap-2.5 rounded-[10px] border border-warning-border bg-warning-soft px-2.5 py-2">
          <TriangleAlertIcon className="size-5 shrink-0 text-warning" strokeWidth={2} />
          <p className="text-[13px] text-ink-900">
            Barang bekas, stok hanya 1 unit. Jumlah tidak bisa ditambah.
          </p>
        </div>
      ) : null}
    </li>
  );
}
