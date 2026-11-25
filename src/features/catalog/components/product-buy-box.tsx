"use client";

import { useQuery } from "@tanstack/react-query";
import { MessageSquareIcon, MinusIcon, PlusIcon, ShoppingCartIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { MButton } from "@/components/mobile/m-button";
import { BottomSheet, SheetClose, SheetRoot } from "@/components/mobile/sheet";
import { StickyBar } from "@/components/mobile/sticky-bar";
import { setPreferredFulfillment, type Fulfillment } from "@/features/checkout/preference";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { useAddToCart } from "../hooks/use-add-to-cart";
import type { ProductDetail } from "../types";
import { ProductImage } from "./product-image";

function toWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
}

function Stepper({
  value,
  max,
  disabled,
  onChange,
}: {
  value: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const btn = "flex size-[34px] items-center justify-center text-brand-700 disabled:text-ink-300";
  return (
    <div className="flex h-9 items-center overflow-hidden rounded-lg border-[1.5px] border-ink-200">
      <button
        type="button"
        aria-label="Kurangi jumlah"
        className={btn}
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <MinusIcon className="size-[18px]" strokeWidth={2} />
      </button>
      <span className="w-9 text-center text-[15px] font-bold text-ink-900" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Tambah jumlah"
        className={btn}
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon className="size-[18px]" strokeWidth={2} />
      </button>
    </div>
  );
}

export function ProductBuyBar({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const trpc = useTRPC();
  const { data: settings } = useQuery(trpc.settings.get.queryOptions());
  const available = Math.max(0, Number(product.available));
  const soldOut = available <= 0;
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<"add" | "buy">("add");
  const [quantity, setQuantity] = useState(1);
  const [fulfillment, setFulfillment] = useState<Fulfillment>("ambil");
  const { addToCart, isPending, isSessionLoading } = useAddToCart();
  const qty = Math.min(Math.max(quantity, 1), Math.max(available, 1));
  const phone = settings?.phone.trim() ?? "";

  function openSheet(kind: "add" | "buy") {
    setIntent(kind);
    setOpen(true);
  }

  async function submit() {
    const ok = await addToCart(product.id, qty);
    if (!ok) return;
    setPreferredFulfillment(fulfillment);
    setOpen(false);
    if (intent === "buy") {
      router.push("/keranjang");
      return;
    }
    toast.success("Produk dimasukkan ke keranjang.", {
      action: { label: "Lihat keranjang", onClick: () => router.push("/keranjang") },
    });
  }

  return (
    <>
      <StickyBar>
        {phone ? (
          <a
            href={`https://wa.me/${toWhatsAppNumber(phone)}?text=${encodeURIComponent(`Halo, saya tertarik dengan ${product.name}`)}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Hubungi toko"
            className="flex size-[52px] shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-brand-600 text-brand-600"
          >
            <MessageSquareIcon className="size-6" strokeWidth={1.8} />
          </a>
        ) : null}
        <MButton
          variant="outline"
          className="h-[52px] flex-1"
          disabled={soldOut}
          onClick={() => openSheet("add")}
        >
          <ShoppingCartIcon className="size-[18px]" />
          Masukkan keranjang
        </MButton>
        <MButton className="h-[52px] flex-1" disabled={soldOut} onClick={() => openSheet("buy")}>
          {soldOut ? "Stok habis" : "Beli sekarang"}
        </MButton>
      </StickyBar>

      <SheetRoot open={open} onOpenChange={setOpen}>
        <BottomSheet title="Tambah ke keranjang">
          <div className="flex h-12 items-center gap-1 pr-2 pl-4">
            <p className="flex-1 text-[17px] font-bold text-ink-900">Tambah ke keranjang</p>
            <SheetClose
              aria-label="Tutup"
              className="flex size-10 items-center justify-center rounded-full text-ink-500"
            >
              <XIcon className="size-6" strokeWidth={1.8} />
            </SheetClose>
          </div>
          <div className="flex flex-col gap-3 px-4 py-1">
            <div className="flex items-center gap-3">
              <div className="size-[72px] shrink-0 overflow-hidden rounded-[10px] bg-ink-100">
                <ProductImage
                  src={product.images[0]?.url}
                  alt=""
                  className="size-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-xl font-bold text-brand-700">{formatRupiah(product.price)}</p>
                <p className="text-[13px] text-ink-500">Stok tersedia: {available} unit</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold text-ink-900">Pilihan pengambilan</p>
              <div className="flex gap-2">
                {(
                  [
                    ["kirim", "Dikirim"],
                    ["ambil", "Ambil di toko"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={fulfillment === value}
                    onClick={() => setFulfillment(value)}
                    className={cn(
                      "h-[38px] rounded-lg border-[1.5px] px-4 text-sm",
                      fulfillment === value
                        ? "border-brand-600 bg-brand-100 font-bold text-brand-700"
                        : "border-ink-200 bg-white font-medium text-ink-900",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="flex-1 text-sm font-bold text-ink-900">Jumlah</p>
              <Stepper value={qty} max={available} disabled={isPending} onChange={setQuantity} />
            </div>
            <div className="flex items-center gap-2">
              <p className="flex-1 text-sm text-ink-500">Subtotal</p>
              <p className="text-base font-bold text-ink-900">{formatRupiah(product.price * qty)}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 border-t border-ink-200 px-4 pt-2.5 pb-[18px]">
            <MButton
              size="lg"
              block
              loading={isPending}
              disabled={isSessionLoading}
              className={cn(isPending && "bg-brand-700")}
              onClick={submit}
            >
              {isPending ? "Menambahkan…" : intent === "buy" ? "Beli sekarang" : "Masukkan keranjang"}
            </MButton>
          </div>
        </BottomSheet>
      </SheetRoot>
    </>
  );
}
