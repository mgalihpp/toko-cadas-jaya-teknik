"use client";

import {
  ChevronRightIcon,
  ClockIcon,
  LogInIcon,
  ShieldAlertIcon,
  ShoppingCartIcon,
  StoreIcon,
  TagIcon,
  WifiOffIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MButton, MLink } from "@/components/mobile/m-button";
import { StickyBar } from "@/components/mobile/sticky-bar";
import { TopBar } from "@/components/mobile/top-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { getPreferredFulfillment } from "@/features/checkout/preference";
import { formatRupiah } from "@/lib/format";
import { useCart, useIsCustomer } from "../hooks/use-cart";
import { useCartSelection } from "../selection";
import { CartItemRow, Checkbox } from "./cart-item-row";
import { StatusPanel } from "./status-panel";

export function CartPage() {
  const { session, isPending: sessionPending, isCustomer } = useIsCustomer();
  const cart = useCart();
  const [editing, setEditing] = useState(false);
  const items = cart.data?.items ?? [];
  const selection = useCartSelection(items.map((i) => i.id));

  const loading = sessionPending || (isCustomer && cart.isPending);
  const ready = !loading && session && isCustomer && cart.data && items.length > 0;

  const title = ready ? `Keranjang (${items.length})` : "Keranjang";
  const edit =
    ready ? (
      <button
        type="button"
        onClick={() => setEditing((e) => !e)}
        className="px-3 text-sm font-bold text-brand-600"
      >
        {editing ? "Selesai" : "Ubah"}
      </button>
    ) : null;

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title={title} backHref="/" cart={false} right={edit} />
      {loading ? (
        <CartSkeleton />
      ) : !session ? (
        <StatusPanel
          icon={LogInIcon}
          title="Masuk untuk melihat keranjang"
          description="Keranjangmu tersimpan di akun. Masuk atau daftar dulu untuk menambah dan memesan barang."
        >
          <MLink href="/masuk?next=/keranjang" className="h-[46px] px-6">
            Masuk
          </MLink>
          <MLink href="/daftar?next=/keranjang" variant="secondary" className="h-[46px] px-6">
            Daftar
          </MLink>
        </StatusPanel>
      ) : !isCustomer ? (
        <StatusPanel
          icon={ShieldAlertIcon}
          tone="error"
          title="Keranjang khusus pelanggan"
          description="Akun admin tidak dapat berbelanja. Masuk dengan akun pelanggan untuk memakai keranjang."
        >
          <MLink href="/admin" variant="secondary" className="h-[46px] px-6">
            Ke Panel Admin
          </MLink>
        </StatusPanel>
      ) : cart.isError || !cart.data ? (
        <StatusPanel
          icon={WifiOffIcon}
          tone="error"
          title="Koneksi terputus"
          description="Keranjang belum bisa dimuat. Periksa internet lalu coba lagi."
        >
          <MButton className="px-7" loading={cart.isFetching} onClick={() => cart.refetch()}>
            Coba lagi
          </MButton>
        </StatusPanel>
      ) : items.length === 0 ? (
        <StatusPanel
          icon={ShoppingCartIcon}
          title="Keranjangmu masih kosong"
          description="Mulai dari kategori favorit atau lihat barang bekas pilihan."
        >
          <MLink href="/produk" className="h-[46px] px-6">
            Lihat katalog
          </MLink>
        </StatusPanel>
      ) : (
        <CartBody editing={editing} selection={selection} items={items} />
      )}
    </div>
  );
}

function CartBody({
  items,
  selection,
  editing,
}: {
  items: NonNullable<ReturnType<typeof useCart>["data"]>["items"];
  selection: ReturnType<typeof useCartSelection>;
  editing: boolean;
}) {
  const router = useRouter();
  const chosen = items.filter((i) => selection.isSelected(i.id) && i.purchasable);
  const total = chosen.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const fulfillment = getPreferredFulfillment() === "kirim" ? "Dikirim" : "Ambil di toko";

  return (
    <>
      <div className="flex flex-1 flex-col pb-[76px]">
        <div className="bg-white px-3 py-2">
          <div className="flex items-center gap-2.5 rounded-[10px] border border-info-border bg-info-soft px-2.5 py-2">
            <ClockIcon className="size-5 shrink-0 text-brand-700" strokeWidth={2} />
            <p className="text-[13px] text-ink-900">Stok baru dikunci setelah kamu menyelesaikan checkout.</p>
          </div>
        </div>
        <div className="h-2" />
        <div className="flex items-center gap-2 border-b border-ink-200 bg-white p-3">
          <Checkbox
            checked={selection.allSelected}
            onChange={() => selection.setAll(!selection.allSelected)}
            label="Pilih semua"
          />
          <StoreIcon className="size-5 text-brand-600" strokeWidth={1.8} />
          <p className="flex-1 text-[15px] font-bold text-ink-900">Cadas Jaya Teknik</p>
          <ChevronRightIcon className="size-[18px] text-ink-500" />
        </div>
        <ul className="bg-white">
          {items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              selected={selection.isSelected(item.id)}
              onToggle={() => selection.toggle(item.id)}
              fulfillmentLabel={fulfillment}
              editing={editing}
            />
          ))}
        </ul>
        <div className="h-2" />
        <div className="flex items-center gap-2 bg-white p-3">
          <TagIcon className="size-5 text-brand-600" strokeWidth={1.8} />
          <p className="flex-1 text-sm font-medium text-ink-500">Belum ada voucher</p>
          <ChevronRightIcon className="size-[18px] text-ink-500" />
        </div>
      </div>

      <StickyBar>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selection.allSelected}
            onChange={() => selection.setAll(!selection.allSelected)}
            label="Pilih semua"
          />
          <span className="text-sm font-medium text-ink-900">Semua</span>
        </div>
        <div className="flex flex-1 flex-col text-right">
          <span className="text-xs text-ink-500">Total</span>
          <span className="text-lg leading-[1.2] font-bold text-brand-700">{formatRupiah(total)}</span>
        </div>
        <MButton
          size="lg"
          className="w-[150px]"
          disabled={chosen.length === 0}
          onClick={() => router.push("/checkout")}
        >
          Checkout ({chosen.length})
        </MButton>
      </StickyBar>
    </>
  );
}

function CartSkeleton() {
  return (
    <div role="status" className="flex flex-col bg-white">
      <span className="sr-only">Memuat keranjang</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-2.5 border-b border-ink-200 p-3">
          <Skeleton className="size-[22px] rounded-md" />
          <Skeleton className="size-[76px] rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
