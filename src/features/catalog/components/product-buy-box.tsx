"use client";

import {
  CircleCheckIcon,
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

function StockAlert({ available }: { available: number }) {
  const level = stockLevel(available);
  const config = {
    habis: {
      icon: CircleXIcon,
      box: "border-error-border bg-error-soft",
      tone: "text-error",
      title: "Stok habis",
      body: "Unit ini sedang tidak tersedia. Cek lagi nanti atau lihat produk serupa di bawah.",
    },
    terakhir: {
      icon: TriangleAlertIcon,
      box: "border-warning-border bg-warning-soft",
      tone: "text-warning",
      title: "Tersisa 1 unit",
      body: "Unit dikunci untukmu begitu checkout selesai. Pembayaran transfer ditunggu 24 jam.",
    },
    tersedia: {
      icon: CircleCheckIcon,
      box: "border-success-border bg-success-soft",
      tone: "text-success",
      title: `Stok tersedia ${available} unit`,
      body: "Stok dikunci untukmu begitu checkout selesai.",
    },
  }[level];
  const Icon = config.icon;
  return (
    <div className={cn("flex gap-3 rounded-xl border p-4", config.box)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", config.tone)} />
      <div className="flex flex-col gap-1">
        <p className={cn("text-sm font-bold", config.tone)}>{config.title}</p>
        <p className="text-[13px] text-ink-800">{config.body}</p>
      </div>
    </div>
  );
}

function QuantityStepper({
  value,
  max,
  disabled,
  onChange,
}: {
  value: number;
  max: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  const btn =
    "flex h-12 w-11 items-center justify-center text-ink-900 outline-none hover:bg-ink-100 focus-visible:bg-ink-100 disabled:text-ink-300 disabled:hover:bg-transparent";
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
      <span className="w-11 text-center text-[15px] font-semibold text-ink-900" aria-live="polite">
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <ConditionBadge condition={product.condition} />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-2.5 py-1 text-xs leading-none font-semibold text-ink-700">
          <span className="size-1.5 rounded-full bg-ink-500" aria-hidden />
          {product.categoryName}
        </span>
      </div>

      <h1 className="text-3xl leading-tight font-bold tracking-tight text-ink-900 lg:text-[38px]">
        {product.name}
      </h1>

      <p className="font-heading text-3xl font-bold text-ink-900 lg:text-4xl">
        {formatRupiah(product.price)}
      </p>

      <StockAlert available={available} />

      <div className="flex flex-wrap gap-3 pt-2 [&>button]:min-w-[150px] [&>button]:basis-[150px]">
        <QuantityStepper
          value={qty}
          max={available}
          disabled={soldOut || busy}
          onChange={setQuantity}
        />
        <Button
          variant="outline"
          className="h-12 flex-1 border-ink-300 text-sm font-semibold"
          disabled={soldOut || busy}
          onClick={() => handle("add")}
        >
          {action === "add" ? <Spinner /> : <ShoppingCartIcon />}
          {action === "add" ? "Menambahkan" : "Tambah ke keranjang"}
        </Button>
        <Button
          className="h-12 flex-1 text-sm font-semibold"
          disabled={soldOut || busy}
          onClick={() => handle("buy")}
        >
          {action === "buy" ? <Spinner /> : null}
          {soldOut ? "Stok habis" : "Beli Sekarang"}
        </Button>
      </div>

      <ul className="flex flex-col border-t border-ink-200">
        {[
          {
            icon: StoreIcon,
            title: "Ambil di toko",
            body: "Ambil langsung di toko Cadas Jaya Teknik, lihat alamat di halaman Kontak",
          },
          { icon: TruckIcon, title: "Dikirim", body: "Ongkir dikonfirmasi Owner setelah pesanan dibuat" },
          { icon: WalletIcon, title: "Pembayaran", body: "Tunai saat serah terima atau transfer bank" },
        ].map((item) => (
          <li key={item.title} className="flex items-start gap-3.5 border-b border-ink-200 py-4">
            <item.icon className="mt-0.5 size-5 shrink-0 text-ink-900" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-ink-900">{item.title}</span>
              <span className="text-[13px] text-ink-500">{item.body}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
