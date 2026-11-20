"use client";

import {
  CheckIcon,
  CircleXIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  StoreIcon,
  TriangleAlertIcon,
  TruckIcon,
  WalletIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAddToCart } from "../hooks/use-add-to-cart";
import type { ProductDetail } from "../types";
import { ConditionBadge } from "./condition-badge";
import { stockLevel } from "./stock-indicator";

const USED_NOTES = [
  "Sudah diuji nyala oleh toko",
  "Foto adalah unit asli dari beberapa sisi",
  "Hanya 1 unit, dikunci saat checkout",
];

function StockAlert({ available }: { available: number }) {
  const level = stockLevel(available);
  if (level === "tersedia") return null;
  const config =
    level === "habis"
      ? {
          icon: CircleXIcon,
          box: "border-error-border bg-error-soft",
          tone: "text-error",
          title: "Stok habis",
          body: "Unit ini sedang tidak tersedia. Cek lagi nanti atau lihat produk serupa di bawah.",
        }
      : {
          icon: TriangleAlertIcon,
          box: "border-warning-border bg-warning-soft",
          tone: "text-warning",
          title: "Tersisa 1 unit",
          body: "Dikunci untukmu saat checkout selesai. Transfer ditunggu 24 jam.",
        };
  const Icon = config.icon;
  return (
    <div className={cn("flex gap-3 rounded-xl border p-3.5", config.box)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", config.tone)} />
      <div className="flex flex-col gap-0.5">
        <p className={cn("text-sm font-bold", config.tone)}>{config.title}</p>
        <p className="text-[13px] leading-snug text-ink-600">{config.body}</p>
      </div>
    </div>
  );
}

function QuantityStepper({
  value,
  max,
  disabled,
  onChange,
  compact = false,
}: {
  value: number;
  max: number;
  disabled: boolean;
  onChange: (value: number) => void;
  compact?: boolean;
}) {
  const btn = cn(
    "flex h-12 items-center justify-center text-ink-900 outline-none hover:bg-ink-100 focus-visible:bg-ink-100 disabled:text-ink-300 disabled:hover:bg-transparent",
    compact ? "w-9" : "w-11"
  );
  return (
    <div className="flex h-12 shrink-0 items-center overflow-hidden rounded-[10px] border border-ink-300 bg-white">
      <button
        type="button"
        aria-label="Kurangi jumlah"
        className={btn}
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <MinusIcon className="size-4" />
      </button>
      <span
        className={cn(
          "text-center text-[15px] font-semibold text-ink-900",
          compact ? "w-7" : "w-10"
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Tambah jumlah"
        className={btn}
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}

export function ProductBuyBox({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const available = Math.max(0, Number(product.available));
  const soldOut = available <= 0;
  const [quantity, setQuantity] = useState(1);
  const qty = Math.min(Math.max(quantity, 1), Math.max(available, 1));
  const { addToCart, isPending, isSessionLoading } = useAddToCart();
  const [action, setAction] = useState<"add" | "buy" | null>(null);
  const busy = isPending || isSessionLoading;
  const specs = Object.entries(product.specs ?? {}).filter(([key, value]) => key && value);
  const used = product.condition === "bekas";
  const level = stockLevel(available);

  async function handle(kind: "add" | "buy") {
    setAction(kind);
    const ok = await addToCart(product.id, qty);
    setAction(null);
    if (!ok) return;
    if (kind === "buy") {
      router.push("/keranjang");
    } else {
      toast.success(`${product.name} ditambahkan ke keranjang`, {
        action: { label: "Lihat", onClick: () => router.push("/keranjang") },
      });
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <ConditionBadge condition={product.condition} className="rounded-md px-2.5 py-1 font-bold" />
        <span className="text-[13px] font-medium text-ink-500">{product.categoryName}</span>
      </div>

      <h1 className="text-2xl leading-tight font-bold tracking-tight text-ink-900 lg:text-[30px]">
        {product.name}
      </h1>

      <p className="font-heading text-3xl font-bold text-ink-900 lg:text-[34px]">
        {formatRupiah(product.price)}
      </p>

      {specs.length > 0 ? (
        <div className="flex flex-wrap gap-2 lg:hidden">
          {specs.slice(0, 3).map(([key, value]) => (
            <span
              key={key}
              className="rounded-full bg-ink-100 px-2.5 py-1.5 text-xs leading-none font-semibold text-ink-700"
            >
              {value}
            </span>
          ))}
        </div>
      ) : null}

      {level === "tersedia" ? (
        <p className="flex items-center gap-1.5 text-sm font-semibold text-success">
          <span className="size-2 rounded-full bg-current" aria-hidden />
          Stok tersedia {available} unit
        </p>
      ) : (
        <StockAlert available={available} />
      )}

      {used ? (
        <div className="flex flex-col gap-3 rounded-xl bg-ink-50 p-4">
          <p className="text-sm font-bold text-ink-900">Kondisi barang</p>
          {USED_NOTES.map((line) => (
            <p key={line} className="flex items-start gap-2.5 text-[13px] text-ink-600">
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" />
              {line}
            </p>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 pt-1">
        <div className="hidden gap-3 lg:flex">
          <QuantityStepper
            value={qty}
            max={available}
            disabled={soldOut || busy}
            onChange={setQuantity}
          />
          <Button
            className="h-12 flex-1 text-[15px] font-semibold"
            disabled={soldOut || busy}
            onClick={() => handle("add")}
          >
            {action === "add" ? <Spinner /> : <ShoppingCartIcon />}
            {soldOut ? "Stok habis" : action === "add" ? "Menambahkan" : "Tambah ke keranjang"}
          </Button>
        </div>
        <Button
          variant="outline"
          className="h-12 w-full border-ink-900 text-[15px] font-semibold text-ink-900"
          disabled={soldOut || busy}
          onClick={() => handle("buy")}
        >
          {action === "buy" ? <Spinner /> : null}
          Beli sekarang
        </Button>
      </div>

      <ul className="flex flex-col gap-4 pt-3">
        {[
          {
            icon: StoreIcon,
            title: "Ambil di toko",
            body: used
              ? "Disarankan agar bisa mengecek barang langsung sebelum membayar"
              : "Ambil langsung di toko, lihat alamat di halaman Kontak",
          },
          {
            icon: TruckIcon,
            title: "Dikirim",
            body: "Ongkir dikonfirmasi Owner setelah pesanan dibuat",
          },
          {
            icon: WalletIcon,
            title: "Bayar tunai atau transfer",
            body: "Rekening tujuan tampil saat checkout",
          },
        ].map((item) => (
          <li key={item.title} className="flex items-start gap-3">
            <item.icon className="mt-0.5 size-5 shrink-0 text-ink-700" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-ink-900">{item.title}</span>
              <span className="text-[13px] leading-snug text-ink-500">{item.body}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-ink-200 bg-background px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(28,25,23,0.08)] lg:hidden">
        <QuantityStepper
          compact
          value={qty}
          max={available}
          disabled={soldOut || busy}
          onChange={setQuantity}
        />
        <Button
          className="h-12 flex-1 text-[15px] font-semibold"
          disabled={soldOut || busy}
          onClick={() => handle("add")}
        >
          {action === "add" ? <Spinner /> : <ShoppingCartIcon />}
          {soldOut ? "Stok habis" : "Tambah ke keranjang"}
        </Button>
      </div>
    </div>
  );
}
