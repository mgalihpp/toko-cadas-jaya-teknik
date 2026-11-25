"use client";

import { LogInIcon, ShieldAlertIcon, ShoppingCartIcon, WifiOffIcon } from "lucide-react";
import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { MButton, MLink } from "@/components/mobile/m-button";
import { TopBar } from "@/components/mobile/top-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPanel, useCart, useIsCustomer } from "@/features/cart";
import { CheckoutForm } from "./checkout-form";

export function CheckoutPage() {
  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Checkout" backHref="/keranjang" cart={false} />
      <CheckoutContent />
    </div>
  );
}

function CheckoutContent() {
  const { session, isPending: sessionPending, isCustomer } = useIsCustomer();
  const cart = useCart();
  const [placedCode, setPlacedCode] = useState<string | null>(null);

  if (placedCode) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center text-ink-500" role="status">
        <Loader2Icon className="size-6 animate-spin text-brand-600" />
        <p className="text-sm">Pesanan {placedCode} dibuat. Membuka halaman pembayaran…</p>
      </div>
    );
  }
  if (sessionPending || (isCustomer && cart.isPending)) return <CheckoutSkeleton />;
  if (!session) {
    return (
      <StatusPanel
        icon={LogInIcon}
        title="Masuk untuk checkout"
        description="Pesanan disimpan di akunmu agar statusnya bisa dipantau. Masuk atau daftar dulu."
      >
        <MLink href="/masuk?next=/checkout" className="h-[46px] px-6">
          Masuk
        </MLink>
      </StatusPanel>
    );
  }
  if (!isCustomer) {
    return (
      <StatusPanel
        icon={ShieldAlertIcon}
        tone="error"
        title="Checkout khusus pelanggan"
        description="Akun admin tidak dapat membuat pesanan. Masuk dengan akun pelanggan."
      />
    );
  }
  if (cart.isError || !cart.data) {
    return (
      <StatusPanel
        icon={WifiOffIcon}
        tone="error"
        title="Koneksi terputus"
        description="Data keranjang belum bisa dimuat. Periksa internet lalu coba lagi."
      >
        <MButton className="px-7" loading={cart.isFetching} onClick={() => cart.refetch()}>
          Coba lagi
        </MButton>
      </StatusPanel>
    );
  }
  if (cart.data.items.length === 0) {
    return (
      <StatusPanel
        icon={ShoppingCartIcon}
        title="Keranjangmu masih kosong"
        description="Tambahkan barang ke keranjang dulu sebelum checkout."
      >
        <MLink href="/produk" className="h-[46px] px-6">
          Lihat katalog
        </MLink>
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
    <div role="status" className="flex flex-col gap-1.5">
      <span className="sr-only">Memuat checkout</span>
      {[96, 150, 130, 100].map((h, i) => (
        <Skeleton key={i} className="w-full rounded-none" style={{ height: h }} />
      ))}
    </div>
  );
}
