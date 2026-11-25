"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { ReceiptTextIcon, SearchIcon, UserIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AdminHeader, AdminHeaderAction } from "@/components/layout";
import { useSwipe } from "@/components/mobile/use-swipe";
import { EmptyState, ErrorState, ORDER_STATUS_LABEL, OrderStatusBadge, type OrderStatus } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { isOrderStatus, ORDER_STATUS_ORDER, PAYMENT_METHOD_LABEL } from "../labels";
import { useSearchParamState } from "../hooks/use-search-param-state";

const TABS: { value: OrderStatus | null; label: string }[] = [
  { value: null, label: "Semua" },
  { value: "menunggu_pembayaran", label: "Menunggu bayar" },
  { value: "menunggu_konfirmasi", label: ORDER_STATUS_LABEL.menunggu_konfirmasi },
  { value: "dibayar", label: "Dibayar" },
  { value: "diproses", label: "Diproses" },
  { value: "selesai", label: "Selesai" },
  { value: "dibatalkan", label: "Dibatalkan" },
];

function ago(date: Date) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Kemarin" : `${days} hari lalu`;
}

export function AdminOrderList() {
  const trpc = useTRPC();
  const { searchParams, setParams } = useSearchParamState();
  const rawStatus = searchParams.get("status");
  const status = isOrderStatus(rawStatus) ? rawStatus : undefined;
  const q = searchParams.get("q") ?? "";
  const [searching, setSearching] = useState(Boolean(q));
  const [text, setText] = useState(q);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    tabRefs.current[status ?? "semua"]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [status]);

  const list = useQuery(trpc.admin.orders.list.queryOptions({ status, q: q || undefined, pageSize: 100 }));
  const counts = useQueries({
    queries: ORDER_STATUS_ORDER.map((s) => trpc.admin.orders.list.queryOptions({ status: s, pageSize: 1 })),
  });
  const awaiting = counts[ORDER_STATUS_ORDER.indexOf("menunggu_konfirmasi")]?.data?.total ?? 0;

  const idx = TABS.findIndex((t) => (t.value ?? undefined) === status);
  const go = (delta: number) => {
    const next = TABS[idx + delta];
    if (next) setParams({ status: next.value, page: null });
  };
  const swipe = useSwipe<HTMLDivElement>({ onLeft: () => go(1), onRight: () => go(-1) });

  return (
    <div className="flex flex-1 flex-col">
      <AdminHeader
        title="Pesanan"
        right={
          <AdminHeaderAction
            label={searching ? "Tutup pencarian" : "Cari"}
            onClick={() => {
              if (searching) {
                setText("");
                setParams({ q: null });
              }
              setSearching((s) => !s);
            }}
          >
            {searching ? <XIcon className="size-6" strokeWidth={1.8} /> : <SearchIcon className="size-6" strokeWidth={1.8} />}
          </AdminHeaderAction>
        }
      />
      {searching ? (
        <form
          role="search"
          className="border-b border-ink-200 bg-white px-3 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            setParams({ q: text.trim() || null });
          }}
        >
          <div className="flex h-11 items-center gap-2 rounded-[10px] bg-ink-50 px-3">
            <SearchIcon className="size-5 text-brand-600" strokeWidth={2} />
            <input
              autoFocus
              type="search"
              aria-label="Cari pesanan"
              placeholder="Cari kode atau nama pelanggan"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-500"
            />
          </div>
        </form>
      ) : null}
      <div role="tablist" aria-label="Status pesanan" className="cjt-no-scrollbar flex overflow-x-auto border-b border-ink-200 bg-white">
        {TABS.map((t) => {
          const active = (t.value ?? undefined) === status;
          const n = t.value === "menunggu_konfirmasi" ? awaiting : 0;
          return (
            <button
              key={t.value ?? "semua"}
              ref={(el) => {
                tabRefs.current[t.value ?? "semua"] = el;
              }}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setParams({ status: t.value, page: null })}
              className={cn(
                "flex h-[46px] shrink-0 items-center gap-1.5 border-b-[3px] px-3.5 text-sm whitespace-nowrap",
                active ? "border-brand-600 font-bold text-brand-700" : "border-transparent font-medium text-ink-500",
              )}
            >
              {t.label}
              {n > 0 ? (
                <span className="rounded-full bg-accent-yellow px-1.5 text-[11px] font-bold text-ink-900">{n}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div ref={swipe} className="flex flex-1 flex-col">
        {list.isPending ? (
          <OrdersSkeleton />
        ) : list.isError ? (
          <ErrorState description={list.error.message} onRetry={() => list.refetch()} />
        ) : list.data.items.length === 0 ? (
          <EmptyState
            icon={ReceiptTextIcon}
            title={q || status ? "Tidak ada pesanan yang cocok" : "Belum ada pesanan"}
            description={q || status ? "Coba ubah kata kunci atau status." : "Pesanan pelanggan akan muncul di sini."}
          />
        ) : (
          <ul>
            {list.data.items.map((o) => (
              <li key={o.id} className="border-b border-ink-200 bg-white">
                <Link href={`/admin/pesanan/${o.code}`} className="flex flex-col gap-2 p-3">
                  <div className="flex items-center gap-2">
                    <p className="flex-1 text-sm font-bold text-ink-900">{o.code}</p>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="size-4 text-ink-500" strokeWidth={1.8} />
                    <p className="text-[13px] font-medium text-ink-900">{o.recipientName}</p>
                    <p className="text-xs text-ink-500">{ago(o.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="flex-1 text-xs text-ink-500">
                      {o.lineCount} produk · {PAYMENT_METHOD_LABEL[o.paymentMethod]}
                    </p>
                    <p className="text-base font-bold text-brand-700">{formatRupiah(o.total)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function OrdersSkeleton() {
  return (
    <div role="status" className="flex flex-col">
      <span className="sr-only">Memuat pesanan</span>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-2 border-b border-ink-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="ml-auto h-[22px] w-28" />
          </div>
          <Skeleton className="h-3 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="ml-auto h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
