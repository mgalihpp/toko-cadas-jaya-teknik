"use client";

import { Check, LogIn, RotateCw, ShieldAlert, ShieldCheck, ShoppingCart, WifiOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { StatusPanel, useCart, useIsCustomer } from "@/features/cart";
import { cn } from "@/lib/utils";
import { CheckoutForm } from "./checkout-form";

export function CheckoutPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-20 sm:px-6 lg:px-20 lg:pt-8 lg:pb-28">
      <CheckoutSteps />
      <CheckoutContent />
    </div>
  );
}

const steps = ["Keranjang", "Checkout", "Pembayaran"] as const;

function CheckoutSteps() {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5 lg:mb-12">
      <ol className="flex items-center gap-2 sm:gap-3" aria-label="Langkah pemesanan">
        {steps.map((label, i) => {
          const done = i === 0;
          const current = i === 1;
          return (
            <li key={label} className="flex items-center gap-2 sm:gap-3">
              {i > 0 ? <span className="h-px w-5 bg-ink-300 sm:w-10" aria-hidden /> : null}
              <span
                className="flex items-center gap-2"
                aria-current={current ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-bold",
                    done && "bg-ink-900 text-white",
                    current && "bg-brand-600 text-white",
                    !done && !current && "border border-border text-ink-500"
                  )}
                >
                  {done ? <Check className="size-3.5" /> : i + 1}
                </span>
                {done ? (
                  <Link href="/keranjang" className="text-sm font-medium text-ink-900 hover:underline">
                    {label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "text-sm",
                      current ? "font-semibold text-ink-900" : "hidden font-medium text-ink-500 sm:inline"
                    )}
                  >
                    {label}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="flex items-center gap-1.5 text-[13px] text-ink-600">
        <ShieldCheck className="size-4 text-success" />
        Data aman
      </p>
    </div>
  );
}

function CheckoutContent() {
  const { session, isPending: sessionPending, isCustomer } = useIsCustomer();
  const cart = useCart();
  const [placedCode, setPlacedCode] = useState<string | null>(null);

  if (placedCode) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center text-ink-600" role="status">
        <Spinner className="size-6 text-brand-600" />
        <p className="text-sm">Pesanan {placedCode} dibuat. Membuka detail pesanan...</p>
      </div>
    );
  }

  if (sessionPending || (isCustomer && cart.isPending)) return <CheckoutSkeleton />;

  if (!session) {
    return (
      <StatusPanel
        icon={LogIn}
        title="Masuk untuk checkout"
        description="Pesanan disimpan di akunmu agar statusnya bisa dipantau. Masuk atau daftar dulu."
      >
        <Button asChild size="lg" className="h-11 px-5">
          <Link href="/masuk?next=/checkout">Masuk</Link>
        </Button>
      </StatusPanel>
    );
  }

  if (!isCustomer) {
    return (
      <StatusPanel
        icon={ShieldAlert}
        tone="error"
        title="Checkout khusus pelanggan"
        description="Akun admin tidak dapat membuat pesanan. Masuk dengan akun pelanggan."
      />
    );
  }

  if (cart.isError || !cart.data) {
    return (
      <StatusPanel
        icon={WifiOff}
        tone="error"
        title="Koneksi terputus"
        description="Data keranjang belum bisa dimuat. Periksa internet lalu coba lagi."
      >
        <Button
          size="lg"
          variant="outline"
          className="h-11 px-5"
          onClick={() => cart.refetch()}
          disabled={cart.isFetching}
        >
          <RotateCw className={cart.isFetching ? "animate-spin" : undefined} />
          Coba lagi
        </Button>
      </StatusPanel>
    );
  }

  if (cart.data.items.length === 0) {
    return (
      <StatusPanel
        icon={ShoppingCart}
        title="Keranjangmu masih kosong"
        description="Tambahkan barang ke keranjang dulu sebelum checkout."
      >
        <Button asChild size="lg" className="h-11 px-5">
          <Link href="/produk">Lihat Katalog</Link>
        </Button>
      </StatusPanel>
    );
  }

  return (
    <CheckoutForm
      cart={cart.data}
      onPlaced={setPlacedCode}
      defaults={{
        recipientName: session.user.name ?? "",
        phone: session.user.phone ?? "",
      }}
    />
  );
}

function CheckoutSkeleton() {
  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14">
      <div className="flex flex-col gap-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
