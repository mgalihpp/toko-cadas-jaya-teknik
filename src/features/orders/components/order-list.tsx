"use client";

import { ChevronRight, Package, ReceiptText, WifiOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { canUploadProof, ORDER_TABS, type OrderTab } from "../constants";
import { useOrders } from "../hooks/use-orders";
import type { OrderListItem } from "../types";
import { OrderStatusBadge } from "@/components/shared";

function matchesTab(order: OrderListItem, tab: OrderTab) {
  const def = ORDER_TABS.find((t) => t.value === tab);
  if (!def?.statuses) return true;
  return (def.statuses as readonly string[]).includes(order.status);
}

export function OrderHistory() {
  const { data, isPending, isError, refetch, isRefetching } = useOrders();
  const [tab, setTab] = useState<OrderTab>("semua");

  return (
    <div className="mx-auto w-full min-h-[calc(100svh-64px)] max-w-[1440px] px-4 py-8 sm:px-6 md:py-12 lg:px-20 md:min-h-[calc(100svh-76px)]">
      <h1 className="font-heading text-3xl font-bold text-ink-900 md:text-[44px] md:leading-tight">
        Pesanan saya
      </h1>

      <div
        role="tablist"
        aria-label="Filter status pesanan"
        className="mt-6 flex gap-6 overflow-x-auto border-b border-border"
      >
        {ORDER_TABS.map((t) => {
          const count = data?.filter((o) => matchesTab(o, t.value)).length ?? 0;
          const active = tab === t.value;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.value)}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-2 border-b-2 pb-3 text-sm whitespace-nowrap transition-colors",
                active
                  ? "border-ink-900 font-semibold text-ink-900"
                  : "border-transparent font-medium text-ink-600 hover:text-ink-900"
              )}
            >
              {t.label}
              {data && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-[11px] font-bold",
                    active ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-600"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-2">
        {isPending ? (
          <OrderListSkeleton />
        ) : isError ? (
          <Empty className="mt-6 border border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <WifiOff />
              </EmptyMedia>
              <EmptyTitle>Gagal memuat pesanan</EmptyTitle>
              <EmptyDescription>
                Riwayat pesanan belum bisa dimuat. Periksa internet lalu coba lagi.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
                {isRefetching ? "Memuat..." : "Coba lagi"}
              </Button>
            </EmptyContent>
          </Empty>
        ) : data.length === 0 ? (
          <Empty className="mt-6 border border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptText />
              </EmptyMedia>
              <EmptyTitle>Belum ada pesanan</EmptyTitle>
              <EmptyDescription>
                Pesanan yang kamu buat akan muncul di sini beserta statusnya.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/katalog">Mulai belanja</Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <OrderRows orders={data.filter((o) => matchesTab(o, tab))} />
        )}
      </div>
    </div>
  );
}

function OrderRows({ orders }: { orders: OrderListItem[] }) {
  if (orders.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-ink-500">
        Tidak ada pesanan dengan status ini.
      </p>
    );
  }
  return (
    <ul>
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} />
      ))}
    </ul>
  );
}

function OrderRow({ order }: { order: OrderListItem }) {
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const href = `/pesanan/${order.code}`;
  const firstItem = order.items[0]?.productName;

  return (
    <li className="relative flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border py-5 sm:flex-nowrap">
      <div className="flex size-14 shrink-0 items-center justify-center rounded-[10px] border border-border bg-ink-50 text-ink-500">
        <Package className="size-6" />
      </div>
      <div className="min-w-0 flex-1">
        <Link
          href={href}
          className="text-[15px] font-semibold text-ink-900 after:absolute after:inset-0 hover:text-brand-700"
        >
          {order.code}
        </Link>
        <p className="mt-0.5 truncate text-[13px] text-ink-500">
          {formatDate(order.createdAt)} · {itemCount} barang
          {firstItem ? ` · ${firstItem}` : ""}
        </p>
      </div>
      <div className="flex w-full items-center gap-4 sm:w-auto">
        <OrderStatusBadge status={order.status} />
        <span className="ml-auto text-[17px] font-bold text-ink-900 sm:ml-0 sm:w-36 sm:text-right">
          {formatRupiah(order.total)}
        </span>
        <div className="hidden w-28 justify-end sm:flex">
          {canUploadProof(order) && (
            <Button asChild size="sm" className="relative z-10">
              <Link href={href}>Upload bukti</Link>
            </Button>
          )}
        </div>
        <ChevronRight className="hidden size-4 text-ink-500 sm:block" />
      </div>
      {canUploadProof(order) && (
        <Button asChild size="sm" className="relative z-10 w-full sm:hidden">
          <Link href={href}>Upload bukti</Link>
        </Button>
      )}
    </li>
  );
}

function OrderListSkeleton() {
  return (
    <ul aria-busy="true" aria-label="Memuat pesanan">
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="flex items-center gap-4 border-b border-border py-5">
          <Skeleton className="size-14 rounded-[10px]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="hidden h-6 w-32 rounded-full sm:block" />
          <Skeleton className="h-5 w-24" />
        </li>
      ))}
    </ul>
  );
}
