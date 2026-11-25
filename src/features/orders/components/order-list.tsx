"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ReceiptTextIcon, SearchIcon, StoreIcon, WifiOffIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MButton, MLink } from "@/components/mobile/m-button";
import { BottomSheet, SheetRoot } from "@/components/mobile/sheet";
import { TopBar } from "@/components/mobile/top-bar";
import { useSwipe } from "@/components/mobile/use-swipe";
import { EmptyState, OrderStatusBadge } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsCustomer } from "@/features/cart";
import { ProductThumb } from "@/features/cart";
import { formatDate, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPCClient } from "@/trpc/client";
import { canCancel, canUploadProof, ORDER_TABS, type OrderTab } from "../constants";
import { useCancelOrder, useOrders } from "../hooks/use-orders";
import type { OrderListItem } from "../types";

function matchesTab(order: OrderListItem, tab: OrderTab) {
  const def = ORDER_TABS.find((t) => t.value === tab);
  if (!def?.statuses) return true;
  return (def.statuses as readonly string[]).includes(order.status);
}

function OrderCard({
  order,
  onCancel,
}: {
  order: OrderListItem;
  onCancel: (code: string) => void;
}) {
  const router = useRouter();
  const client = useTRPCClient();
  const queryClient = useQueryClient();
  const [buying, setBuying] = useState(false);
  const first = order.items[0];
  const more = order.items.length - 1;

  async function buyAgain() {
    setBuying(true);
    try {
      for (const item of order.items) {
        await client.cart.add.mutate({ productId: item.productId, quantity: item.quantity });
      }
      await queryClient.invalidateQueries();
      router.push("/keranjang");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menambahkan ke keranjang");
    } finally {
      setBuying(false);
    }
  }

  const small = "h-[38px] px-3.5 text-[13px]";
  return (
    <li className="flex flex-col gap-2.5 border-t border-ink-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <StoreIcon className="size-[18px] text-brand-600" strokeWidth={1.8} />
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <p className="text-sm font-bold text-ink-900">Cadas Jaya Teknik</p>
          <p className="text-xs text-ink-500">
            {order.code} · {formatDate(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      <Link href={`/pesanan/${order.code}`} className="flex items-center gap-2.5">
        <ProductThumb src={first?.image ?? null} alt="" className="size-14" />
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <p className="line-clamp-2 text-[13px] font-medium text-ink-900">
            {first?.productName}
            {more > 0 ? ` dan ${more} produk lain` : ""}
          </p>
          <p className="text-sm font-bold text-brand-700">Total: {formatRupiah(order.total)}</p>
        </div>
      </Link>
      <div className="flex justify-end gap-2">
        {canCancel(order) ? (
          <MButton variant="outline" className={small} onClick={() => onCancel(order.code)}>
            Batalkan
          </MButton>
        ) : null}
        {canUploadProof(order) ? (
          <MLink href={`/pesanan/${order.code}/bayar`} className={cn(small, "px-[18px]")}>
            Bayar
          </MLink>
        ) : null}
        {order.status === "selesai" || order.status === "dibatalkan" ? (
          <MButton variant="secondary" className={small} loading={buying} onClick={buyAgain}>
            Beli lagi
          </MButton>
        ) : (
          <MLink href={`/pesanan/${order.code}`} variant="secondary" className={small}>
            Lihat detail
          </MLink>
        )}
      </div>
    </li>
  );
}

function OrdersSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-2">
      <span className="sr-only">Memuat riwayat pesanan</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-2.5 bg-white p-3">
          <div className="flex items-center gap-2">
            <Skeleton className="size-[18px] rounded" />
            <div className="flex flex-1 flex-col gap-[5px]">
              <Skeleton className="h-3 w-[120px]" />
              <Skeleton className="h-2.5 w-[90px]" />
            </div>
            <Skeleton className="h-[22px] w-[90px]" />
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-14 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3.5 w-2/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function OrderHistory() {
  const { session, isPending: sessionPending, isCustomer } = useIsCustomer();
  const orders = useOrders();
  const cancel = useCancelOrder();
  const initialTab = useSearchParams().get("tab");
  const [tab, setTab] = useState<OrderTab>(
    ORDER_TABS.some((t) => t.value === initialTab) ? (initialTab as OrderTab) : "semua",
  );
  const [search, setSearch] = useState<string | null>(null);
  const [cancelCode, setCancelCode] = useState<string | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const index = ORDER_TABS.findIndex((t) => t.value === tab);
  const go = (delta: number) => {
    const next = ORDER_TABS[index + delta];
    if (next) setTab(next.value);
  };
  const swipe = useSwipe<HTMLDivElement>({ onLeft: () => go(1), onRight: () => go(-1) });

  useEffect(() => {
    tabRefs.current[tab]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [tab]);

  const all = orders.data ?? [];
  const term = search?.trim().toLowerCase() ?? "";
  const filtered = all
    .filter((o) => matchesTab(o, tab))
    .filter(
      (o) =>
        !term ||
        o.code.toLowerCase().includes(term) ||
        o.items.some((i) => i.productName.toLowerCase().includes(term)),
    );

  const searchButton = (
    <button
      type="button"
      aria-label="Cari"
      onClick={() => setSearch((s) => (s === null ? "" : null))}
      className="flex size-11 items-center justify-center rounded-full text-brand-700"
    >
      {search === null ? (
        <SearchIcon className="size-6" strokeWidth={1.8} />
      ) : (
        <XIcon className="size-6" strokeWidth={1.8} />
      )}
    </button>
  );

  let body: React.ReactNode;
  if (sessionPending || (isCustomer && orders.isPending)) {
    body = <OrdersSkeleton />;
  } else if (!session) {
    body = (
      <EmptyState
        icon={ReceiptTextIcon}
        title="Masuk untuk melihat pesanan"
        description="Riwayat pesananmu tersimpan di akun."
        action={
          <MLink href="/masuk?next=/pesanan" className="h-[46px] px-6">
            Masuk
          </MLink>
        }
      />
    );
  } else if (!isCustomer) {
    body = (
      <EmptyState
        icon={ReceiptTextIcon}
        title="Pesanan khusus pelanggan"
        description="Akun admin mengelola pesanan lewat panel admin."
        action={
          <MLink href="/admin/pesanan" className="h-[46px] px-6">
            Ke panel admin
          </MLink>
        }
      />
    );
  } else if (orders.isError) {
    body = (
      <EmptyState
        icon={WifiOffIcon}
        title="Koneksi terputus"
        description="Riwayat pesanan belum bisa dimuat. Periksa internet lalu coba lagi."
        action={
          <MButton className="px-7" onClick={() => orders.refetch()}>
            Coba lagi
          </MButton>
        }
      />
    );
  } else if (filtered.length === 0) {
    body = (
      <EmptyState
        icon={ReceiptTextIcon}
        title="Belum ada pesanan"
        description={
          all.length === 0
            ? "Pesanan yang menunggu konfirmasi pembayaran akan muncul di sini."
            : "Tidak ada pesanan pada kategori ini."
        }
        action={
          <MLink href="/produk" className="h-[46px] px-6">
            Belanja sekarang
          </MLink>
        }
      />
    );
  } else {
    body = (
      <ul className="flex flex-col">
        {filtered.map((order) => (
          <OrderCard key={order.id} order={order} onCancel={setCancelCode} />
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Pesanan saya" backHref="/saya" cart={false} right={searchButton} />
      {search !== null ? (
        <div className="border-b border-ink-200 bg-white px-3 py-2">
          <div className="flex h-11 items-center gap-2 rounded-[10px] bg-ink-50 px-3">
            <SearchIcon className="size-5 text-brand-600" strokeWidth={2} />
            <input
              autoFocus
              type="search"
              aria-label="Cari pesanan"
              placeholder="Cari kode atau nama produk"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-500"
            />
          </div>
        </div>
      ) : null}
      <div role="tablist" aria-label="Status pesanan" className="cjt-no-scrollbar flex overflow-x-auto border-b border-ink-200 bg-white">
        {ORDER_TABS.map((t) => {
          const active = tab === t.value;
          return (
            <button
              key={t.value}
              ref={(el) => {
                tabRefs.current[t.value] = el;
              }}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.value)}
              className={cn(
                "h-[46px] shrink-0 border-b-[3px] px-3.5 text-sm whitespace-nowrap",
                active ? "border-brand-600 font-bold text-brand-700" : "border-transparent font-medium text-ink-500",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div ref={swipe} className="flex flex-1 flex-col">
        {body}
      </div>

      <SheetRoot open={cancelCode !== null} onOpenChange={(open) => !open && setCancelCode(null)}>
        <BottomSheet title="Batalkan pesanan">
          <div className="flex flex-col gap-3 px-4 pt-2 pb-5">
            <p className="text-[17px] font-bold text-ink-900">Batalkan pesanan?</p>
            <p className="text-sm text-ink-500">
              Pesanan {cancelCode} akan dibatalkan dan stok dilepas. Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-2.5">
              <MButton variant="outline" className="flex-1" onClick={() => setCancelCode(null)}>
                Kembali
              </MButton>
              <MButton
                variant="danger"
                className="flex-1"
                loading={cancel.isPending}
                onClick={() =>
                  cancelCode &&
                  cancel.mutate(
                    { code: cancelCode },
                    {
                      onSuccess: () => {
                        toast.success("Pesanan dibatalkan");
                        setCancelCode(null);
                      },
                      onError: (e) => toast.error(e.message),
                    },
                  )
                }
              >
                Batalkan pesanan
              </MButton>
            </div>
          </div>
        </BottomSheet>
      </SheetRoot>
    </div>
  );
}
