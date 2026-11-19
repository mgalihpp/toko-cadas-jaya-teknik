"use client";

import {
  CircleAlert,
  Info,
  Lock,
  LogIn,
  RotateCw,
  ShieldAlert,
  ShoppingCart,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/format";
import { useCart, useIsCustomer } from "../hooks/use-cart";
import { summarize } from "../lib";
import { CartItemRow } from "./cart-item-row";
import { StatusPanel } from "./status-panel";

export function CartPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pt-8 pb-20 sm:px-6 lg:px-20 lg:pt-12 lg:pb-28">
      <CartContent />
    </div>
  );
}

function CartHeading({ count }: { count?: number }) {
  return (
    <div className="mb-6 flex items-baseline gap-3.5 lg:mb-8">
      <h1 className="font-heading text-3xl font-bold text-ink-900 lg:text-[44px]">Keranjang</h1>
      {count !== undefined ? <span className="text-ink-500">{count} produk</span> : null}
    </div>
  );
}

function CartContent() {
  const { session, isPending: sessionPending, isCustomer } = useIsCustomer();
  const cart = useCart();

  if (sessionPending || (isCustomer && cart.isPending)) {
    return (
      <>
        <CartHeading />
        <CartSkeleton />
      </>
    );
  }

  if (!session) {
    return (
      <>
        <CartHeading />
        <StatusPanel
          icon={LogIn}
          title="Masuk untuk melihat keranjang"
          description="Keranjangmu tersimpan di akun. Masuk atau daftar dulu untuk menambah dan memesan barang."
        >
          <Button asChild size="lg" className="h-11 px-5">
            <Link href="/masuk?next=/keranjang">Masuk</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-11 px-5">
            <Link href="/daftar?next=/keranjang">Daftar</Link>
          </Button>
        </StatusPanel>
      </>
    );
  }

  if (!isCustomer) {
    return (
      <>
        <CartHeading />
        <StatusPanel
          icon={ShieldAlert}
          tone="error"
          title="Keranjang khusus pelanggan"
          description="Akun admin tidak dapat berbelanja. Masuk dengan akun pelanggan untuk memakai keranjang."
        >
          <Button asChild size="lg" variant="outline" className="h-11 px-5">
            <Link href="/admin">Ke Panel Admin</Link>
          </Button>
        </StatusPanel>
      </>
    );
  }

  if (cart.isError || !cart.data) {
    return (
      <>
        <CartHeading />
        <StatusPanel
          icon={WifiOff}
          tone="error"
          title="Koneksi terputus"
          description="Keranjang belum bisa dimuat. Periksa internet lalu coba lagi."
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
      </>
    );
  }

  const { items, canCheckout } = cart.data;

  if (items.length === 0) {
    return (
      <>
        <CartHeading count={0} />
        <StatusPanel
          icon={ShoppingCart}
          title="Keranjangmu masih kosong"
          description="Mulai dari kategori favorit atau lihat barang bekas pilihan."
        >
          <Button asChild size="lg" className="h-11 px-5">
            <Link href="/produk">Lihat Katalog</Link>
          </Button>
        </StatusPanel>
      </>
    );
  }

  const summary = summarize(items);

  return (
    <>
      <CartHeading count={items.length} />
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
        <section aria-label="Daftar produk">
          {summary.unavailableCount > 0 ? (
            <div
              role="alert"
              className="mb-2.5 flex items-start gap-3 rounded-xl border border-error-border bg-error-soft px-4 py-3.5 text-sm font-medium text-error"
            >
              <CircleAlert className="mt-px size-5 shrink-0" />
              <p>
                {summary.unavailableCount} produk stoknya habis atau berubah. Hapus atau
                sesuaikan jumlahnya agar bisa lanjut checkout.
              </p>
            </div>
          ) : null}
          <ul>
            {items.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </ul>
        </section>

        <aside className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6 lg:sticky lg:top-24 lg:p-7">
          <h2 className="font-heading text-xl font-semibold text-ink-900">Ringkasan</h2>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-600">Subtotal ({summary.quantity} barang)</dt>
              <dd className="font-medium text-ink-900">{formatRupiah(summary.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-600">Ongkos kirim</dt>
              <dd className="text-right font-medium text-ink-900">Dihitung saat checkout</dd>
            </div>
          </dl>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-[15px] font-semibold text-ink-900">Total</span>
            <span className="font-heading text-2xl font-bold text-ink-900 lg:text-[26px]">
              {formatRupiah(summary.subtotal)}
            </span>
          </div>
          {canCheckout ? (
            <Button asChild size="lg" className="h-12 text-[15px]">
              <Link href="/checkout">
                <Lock />
                Lanjut ke Checkout
              </Link>
            </Button>
          ) : (
            <>
              <Button size="lg" className="h-12 text-[15px]" disabled>
                <Lock />
                Lanjut ke Checkout
              </Button>
              <p className="flex items-start gap-2 text-[13px] text-ink-500">
                <Info className="mt-px size-4 shrink-0" />
                Tombol aktif setelah produk habis dihapus atau jumlahnya disesuaikan
              </p>
            </>
          )}
        </aside>
      </div>
    </>
  );
}

function CartSkeleton() {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
      <div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-5 border-b border-border py-6">
            <Skeleton className="size-20 rounded-xl sm:size-28" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="hidden h-9 w-[108px] sm:block" />
            <Skeleton className="hidden h-5 w-28 sm:block" />
          </div>
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}
