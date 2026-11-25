"use client";

import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HistoryIcon,
  PackageIcon,
  PackageSearchIcon,
  SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { LOW_STOCK } from "../schemas";
import { StockHistorySheet } from "./stock-history-sheet";

const PAGE_SIZE = 20;

const TABS = {
  semua: { label: "Semua", filter: {}, countTone: "bg-ink-100 text-ink-600" },
  menipis: {
    label: "Menipis",
    filter: { lowStockOnly: true, lowStockThreshold: LOW_STOCK },
    countTone: "bg-warning-soft text-warning",
  },
  habis: {
    label: "Habis",
    filter: { lowStockOnly: true, lowStockThreshold: 0 },
    countTone: "bg-ink-100 text-ink-600",
  },
  terkunci: {
    label: "Terkunci",
    filter: { lockedOnly: true },
    countTone: "bg-info-soft text-info",
  },
} as const;
type Tab = keyof typeof TABS;
const TAB_KEYS = Object.keys(TABS) as Tab[];

const headClass = "h-auto px-2 py-2.5 text-xs leading-[15px] font-semibold text-ink-500";
const numberClass = "px-2 py-[11.5px] text-sm font-semibold tabular-nums";

function useDebounced(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function StockList() {
  const trpc = useTRPC();
  const [tab, setTab] = useState<Tab>("semua");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<{ id: string; name: string } | null>(null);
  const search = useDebounced(q.trim());

  const stock = useQuery(
    trpc.admin.stock.list.queryOptions(
      { q: search || undefined, page, pageSize: PAGE_SIZE, ...TABS[tab].filter },
      { placeholderData: keepPreviousData }
    )
  );
  const counts = useQueries({
    queries: TAB_KEYS.map((key) =>
      trpc.admin.stock.list.queryOptions(
        { q: search || undefined, page: 1, pageSize: 1, ...TABS[key].filter },
        { placeholderData: keepPreviousData, select: (d) => d.total }
      )
    ),
  });
  const today = useQuery(trpc.admin.stock.todayActivity.queryOptions());
  const data = stock.data;
  const from = data ? (data.page - 1) * PAGE_SIZE + 1 : 0;
  const to = data ? from + data.items.length - 1 : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-[26px] leading-[33px] font-bold tracking-[-0.6px] text-ink-900">
            Stok
          </h1>
          <p className="text-[13px] leading-4 text-ink-500">
            Stok tersedia = stok fisik dikurangi stok terkunci pesanan
          </p>
        </div>
        <label className="flex h-[37px] w-full items-center gap-2 rounded-[8px] border border-ink-300 bg-white px-3 focus-within:border-brand-600 sm:w-[260px]">
          <SearchIcon className="size-[15px] shrink-0 text-ink-500" />
          <input
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink-900 outline-none placeholder:text-ink-500"
            placeholder="Cari nama produk"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            aria-label="Cari produk"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Terjual hari ini", today.data?.sold, "unit"],
          ["Penyesuaian hari ini", today.data?.adjusted, "kali"],
          ["Dikunci pesanan", today.data?.locked, "unit"],
          ["Dilepas", today.data?.released, "unit"],
        ].map(([label, value, unit]) => (
          <div key={label as string} className="flex flex-col gap-1 rounded-[12px] border border-ink-200 bg-white px-4 py-3">
            <span className="text-xs leading-[15px] text-ink-500">{label}</span>
            {value === undefined ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <span className="font-heading text-xl leading-6 font-bold text-ink-900 tabular-nums">
                {value} <span className="text-[13px] font-medium text-ink-500">{unit}</span>
              </span>
            )}
          </div>
        ))}
      </div>

      <div role="tablist" aria-label="Filter stok" className="flex gap-6 border-b border-ink-200">
        {TAB_KEYS.map((key, i) => {
          const active = tab === key;
          const count = counts[i]?.data;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setTab(key);
                setPage(1);
              }}
              className={cn(
                "-mb-px flex shrink-0 cursor-pointer items-center gap-2 border-b-2 pb-2.5 text-sm leading-[17px] outline-none focus-visible:text-ink-900",
                active
                  ? "border-ink-900 font-semibold text-ink-900"
                  : "border-transparent font-medium text-ink-600 hover:text-ink-900"
              )}
            >
              {TABS[key].label}
              {count !== undefined ? (
                <span
                  className={cn(
                    "rounded-full px-[7px] py-px text-[11px] leading-[13px] font-bold tabular-nums",
                    TABS[key].countTone
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {stock.isError ? (
        <ErrorState description={stock.error.message} onRetry={() => stock.refetch()} />
      ) : data && data.items.length === 0 ? (
        <EmptyState
          icon={PackageSearchIcon}
          title={search ? "Produk tidak ditemukan" : tab === "semua" ? "Belum ada produk" : tab === "terkunci" ? "Tidak ada stok terkunci" : "Semua stok aman"}
          description={
            search
              ? "Coba kata kunci lain."
              : tab === "semua"
                ? "Tambahkan produk dulu untuk mengelola stoknya."
                : "Tidak ada produk di kategori ini."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-ink-200 bg-white">
          <Table>
            <TableHeader className="bg-ink-50">
              <TableRow className="border-ink-200 hover:bg-transparent">
                <TableHead className={cn(headClass, "pl-5")}>Produk</TableHead>
                <TableHead className={cn(headClass, "w-24")}>Fisik</TableHead>
                <TableHead className={cn(headClass, "w-[106px]")}>Terkunci</TableHead>
                <TableHead className={cn(headClass, "w-[106px]")}>Tersedia</TableHead>
                <TableHead className={cn(headClass, "w-[86px]")}>Batas</TableHead>
                <TableHead className={cn(headClass, "w-[150px]")}>Perubahan terakhir</TableHead>
                <TableHead className={cn(headClass, "w-[164px] pr-5")}>
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data
                ? data.items.map((p) => (
                    <TableRow key={p.id} className="h-[63px] border-ink-200">
                      <TableCell className="max-w-80 py-[11.5px] pr-2 pl-5">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-ink-100 text-ink-500">
                            {p.thumbnailUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.thumbnailUrl} alt="" className="size-full rounded-[8px] object-cover" />
                            ) : (
                              <PackageIcon className="size-[18px]" />
                            )}
                          </span>
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <span className="truncate text-sm leading-[17px] font-semibold text-ink-900">
                              {p.name}
                            </span>
                            <span className="text-xs leading-[15px] text-ink-500">
                              {p.condition === "baru" ? "Baru" : "Bekas"}
                              {p.isActive ? "" : ", nonaktif"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={cn(numberClass, "text-ink-900")}>{p.stockPhysical}</TableCell>
                      <TableCell className={cn(numberClass, p.stockLocked > 0 ? "text-info" : "text-ink-500")}>
                        {p.stockLocked}
                      </TableCell>
                      <TableCell
                        className={cn(
                          numberClass,
                          p.available <= 0
                            ? "text-error"
                            : p.available <= LOW_STOCK
                              ? "text-warning"
                              : "text-ink-900"
                        )}
                      >
                        {p.available}
                      </TableCell>
                      <TableCell className={cn(numberClass, "text-ink-500")}>{LOW_STOCK}</TableCell>
                      <TableCell className="px-2 py-[11.5px] text-[13px] text-ink-600">
                        {p.lastChange ? formatDateTime(p.lastChange) : "Belum ada"}
                      </TableCell>
                      <TableCell className="py-[11.5px] pr-5 pl-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            className="size-7 rounded-[8px] p-0 text-ink-600 [&_svg:not([class*='size-'])]:size-[15px]"
                            onClick={() => setHistory({ id: p.id, name: p.name })}
                            aria-label={`Riwayat stok ${p.name}`}
                            title="Riwayat stok"
                          >
                            <HistoryIcon />
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            className="h-7 rounded-[8px] border-ink-300 bg-white px-3 text-[13px] leading-4 font-semibold text-ink-900"
                          >
                            <Link href={`/admin/stok/${p.id}`}>Sesuaikan</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                : Array.from({ length: 6 }, (_, i) => (
                    <TableRow key={i} className="h-[63px] border-ink-200">
                      <TableCell colSpan={7} className="px-5">
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          {data && data.pageCount > 1 ? (
            <div className="flex items-center justify-between gap-2 border-t border-ink-200 px-5 py-3 text-sm text-ink-500">
              <span>
                {from} sampai {to} dari {data.total}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeftIcon />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pageCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Berikutnya
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <StockHistorySheet product={history} onOpenChange={(open) => !open && setHistory(null)} />
    </div>
  );
}
