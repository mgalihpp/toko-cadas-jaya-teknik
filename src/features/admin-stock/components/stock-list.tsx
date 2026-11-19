"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HistoryIcon,
  PackageSearchIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { AdjustStockDialog, type StockProduct } from "./adjust-stock-dialog";
import { StockHistorySheet } from "./stock-history-sheet";

const PAGE_SIZE = 20;
const LOW_STOCK = 2;

const TABS = {
  semua: { label: "Semua", filter: {} },
  menipis: { label: "Menipis", filter: { lowStockOnly: true, lowStockThreshold: LOW_STOCK } },
  habis: { label: "Habis", filter: { lowStockOnly: true, lowStockThreshold: 0 } },
} as const;
type Tab = keyof typeof TABS;

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
  const [adjusting, setAdjusting] = useState<StockProduct | null>(null);
  const [history, setHistory] = useState<{ id: string; name: string } | null>(null);
  const search = useDebounced(q.trim());

  const stock = useQuery(
    trpc.admin.stock.list.queryOptions(
      { q: search || undefined, page, pageSize: PAGE_SIZE, ...TABS[tab].filter },
      { placeholderData: keepPreviousData }
    )
  );
  const data = stock.data;
  const from = data ? (data.page - 1) * PAGE_SIZE + 1 : 0;
  const to = data ? from + data.items.length - 1 : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Stok"
        description="Stok tersedia = stok fisik dikurangi stok terkunci pesanan"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v as Tab);
            setPage(1);
          }}
        >
          <TabsList>
            {(Object.keys(TABS) as Tab[]).map((key) => (
              <TabsTrigger key={key} value={key}>
                {TABS[key].label}
                {tab === key && data ? (
                  <span className="rounded-full bg-ink-100 px-1.5 text-xs tabular-nums text-ink-600">
                    {data.total}
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <InputGroup className="h-9 bg-white sm:max-w-xs">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Cari nama produk"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            aria-label="Cari produk"
          />
        </InputGroup>
      </div>

      {stock.isError ? (
        <ErrorState description={stock.error.message} onRetry={() => stock.refetch()} />
      ) : data && data.items.length === 0 ? (
        <EmptyState
          icon={PackageSearchIcon}
          title={search ? "Produk tidak ditemukan" : tab === "semua" ? "Belum ada produk" : "Semua stok aman"}
          description={
            search
              ? "Coba kata kunci lain."
              : tab === "semua"
                ? "Tambahkan produk dulu untuk mengelola stoknya."
                : "Tidak ada produk di kategori ini."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
          <Table>
            <TableHeader className="bg-ink-50">
              <TableRow>
                <TableHead className="pl-4">Produk</TableHead>
                <TableHead className="text-right">Fisik</TableHead>
                <TableHead className="text-right">Terkunci</TableHead>
                <TableHead className="text-right">Tersedia</TableHead>
                <TableHead className="w-52 pr-4">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data
                ? data.items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="max-w-72 pl-4">
                        <span className="block truncate font-medium text-ink-900">{p.name}</span>
                        <span className="text-xs text-ink-500">
                          {p.condition === "baru" ? "Baru" : "Bekas"}
                          {p.isActive ? "" : ", nonaktif"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{p.stockPhysical}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.stockLocked > 0 ? (
                          <span className="font-medium text-warning">{p.stockLocked}</span>
                        ) : (
                          <span className="text-ink-500">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "inline-flex h-6 min-w-8 items-center justify-center rounded-md px-2 text-sm font-semibold tabular-nums",
                            p.available <= 0
                              ? "bg-error-soft text-error"
                              : p.available <= LOW_STOCK
                                ? "bg-warning-soft text-warning"
                                : "text-ink-900"
                          )}
                        >
                          {p.available}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setHistory({ id: p.id, name: p.name })}
                          >
                            <HistoryIcon />
                            Riwayat
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setAdjusting(p)}>
                            <SlidersHorizontalIcon />
                            Sesuaikan
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                : Array.from({ length: 6 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="px-4">
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          {data && data.total > 0 ? (
            <div className="flex items-center justify-between gap-2 border-t border-ink-200 px-4 py-3 text-sm text-ink-500">
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

      <AdjustStockDialog product={adjusting} onOpenChange={(open) => !open && setAdjusting(null)} />
      <StockHistorySheet product={history} onOpenChange={(open) => !open && setHistory(null)} />
    </div>
  );
}
