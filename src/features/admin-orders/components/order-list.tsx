"use client";

import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { DownloadIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  EmptyState,
  ErrorState,
  ORDER_STATUS_LABEL,
  OrderStatusBadge,
  type OrderStatus,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { downloadCsv, fetchAllPages } from "../csv";
import { formatFullStamp, formatWhen } from "../format";
import { readPage, useSearchParamState } from "../hooks/use-search-param-state";
import {
  FULFILLMENT_LABEL,
  isOrderStatus,
  ORDER_STATUS_DOT,
  ORDER_STATUS_ORDER,
  PAYMENT_METHOD_LABEL,
} from "../labels";
import {
  BODY_CELL,
  CODE_CELL,
  FLAT_BADGE,
  HEAD_CELL,
  HEAD_ROW,
  OUTLINE_ACTION,
  PAGE_TITLE,
  TABLE_FRAME,
} from "../styles";
import { ListPagination } from "./list-pagination";

const PAGE_SIZE = 20;

function itemsLabel(o: { firstItem: string | null; lineCount: number }) {
  if (!o.firstItem) return "-";
  return o.lineCount > 1 ? `${o.firstItem} +${o.lineCount - 1} lainnya` : o.firstItem;
}

export function AdminOrderList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { searchParams, setParams } = useSearchParamState();
  const rawStatus = searchParams.get("status");
  const status = isOrderStatus(rawStatus) ? rawStatus : undefined;
  const q = searchParams.get("q") ?? "";
  const page = readPage(searchParams.get("page"));
  const [search, setSearch] = useState(q);
  const [exporting, setExporting] = useState(false);

  const list = useQuery(
    trpc.admin.orders.list.queryOptions({
      status,
      q: q || undefined,
      page,
      pageSize: PAGE_SIZE,
    })
  );

  const filters: (OrderStatus | undefined)[] = [undefined, ...ORDER_STATUS_ORDER];
  const counts = useQueries({
    queries: filters.map((s) => trpc.admin.orders.list.queryOptions({ status: s, pageSize: 1 })),
  });
  const totalAll = counts[0]?.data?.total;

  async function exportCsv() {
    setExporting(true);
    try {
      const orders = await fetchAllPages((p) =>
        queryClient.fetchQuery(
          trpc.admin.orders.list.queryOptions({
            status,
            q: q || undefined,
            page: p,
            pageSize: 100,
          })
        )
      );
      downloadCsv(
        `pesanan-${status ?? "semua"}.csv`,
        ["Kode", "Pelanggan", "Telepon", "Barang", "Jumlah", "Pengambilan", "Metode", "Total", "Status", "Masuk"],
        orders.map((o) => [
          o.code,
          o.recipientName,
          o.phone,
          itemsLabel(o),
          o.itemCount,
          FULFILLMENT_LABEL[o.fulfillment],
          PAYMENT_METHOD_LABEL[o.paymentMethod],
          o.total,
          ORDER_STATUS_LABEL[o.status],
          formatFullStamp(o.createdAt),
        ])
      );
    } catch {
      toast.error("Ekspor gagal, coba lagi");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className={PAGE_TITLE}>Pesanan</h1>
          <p className="text-[13px] leading-4 text-ink-500">
            {totalAll === undefined
              ? "Memuat jumlah pesanan"
              : `${totalAll} pesanan sejak sistem aktif`}
            {q ? (
              <>
                {", hasil pencarian “"}
                <span className="font-semibold text-ink-900">{q}</span>
                {"” "}
                <button
                  type="button"
                  className="font-semibold text-info hover:underline"
                  onClick={() => {
                    setSearch("");
                    setParams({ q: null, page: null });
                  }}
                >
                  Hapus
                </button>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <form
            className="relative w-full sm:w-64 lg:hidden"
            onSubmit={(e) => {
              e.preventDefault();
              setParams({ q: search.trim(), page: null });
            }}
          >
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-500" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama penerima"
              aria-label="Cari pesanan"
              className="h-[37px] rounded-lg border-ink-300 bg-white pl-9"
            />
          </form>
          <Button
            variant="outline"
            className={OUTLINE_ACTION}
            onClick={exportCsv}
            disabled={exporting}
          >
            {exporting ? <Spinner /> : <DownloadIcon />}
            Ekspor CSV
          </Button>
        </div>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
        {filters.map((s, i) => {
          const active = s === status;
          const count = counts[i]?.data?.total;
          return (
            <button
              key={s ?? "semua"}
              type="button"
              onClick={() => setParams({ status: s ?? null, page: null })}
              aria-pressed={active}
              className={cn(
                "inline-flex h-[30px] shrink-0 items-center gap-2 rounded-full border px-3 text-[13px] font-medium transition-colors",
                active
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-200 bg-white text-ink-900 hover:bg-ink-50"
              )}
            >
              {s ? (
                <span
                  className={cn(
                    "size-[7px] rounded-full",
                    active ? "bg-white" : ORDER_STATUS_DOT[s]
                  )}
                  aria-hidden
                />
              ) : null}
              {s ? ORDER_STATUS_LABEL[s] : "Semua"}
              {count !== undefined ? (
                <span
                  className={cn("text-xs font-semibold", active ? "text-ink-300" : "text-ink-500")}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {list.isError ? (
        <ErrorState onRetry={() => list.refetch()} />
      ) : list.isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : list.data.items.length === 0 ? (
        <EmptyState
          title="Belum ada pesanan"
          description={
            q || status
              ? "Tidak ada pesanan yang cocok dengan filter ini."
              : "Pesanan pelanggan akan muncul di sini."
          }
        />
      ) : (
        <>
          <div className={TABLE_FRAME}>
            <Table className="min-w-[1140px] table-fixed">
              <TableHeader>
                <TableRow className={HEAD_ROW}>
                  <TableHead className={cn(HEAD_CELL, "w-[187px]")}>Kode</TableHead>
                  <TableHead className={cn(HEAD_CELL, "w-[190px]")}>Pelanggan</TableHead>
                  <TableHead className={cn(HEAD_CELL, "w-[220px]")}>Barang</TableHead>
                  <TableHead className={cn(HEAD_CELL, "w-[124px]")}>Pengambilan</TableHead>
                  <TableHead className={cn(HEAD_CELL, "w-[104px]")}>Metode</TableHead>
                  <TableHead className={cn(HEAD_CELL, "w-[144px] text-right")}>Total</TableHead>
                  <TableHead className={cn(HEAD_CELL, "w-[204px]")}>Status</TableHead>
                  <TableHead className={cn(HEAD_CELL, "w-[137px]")}>Masuk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.items.map((order) => {
                  const href = `/admin/pesanan/${encodeURIComponent(order.code)}`;
                  return (
                    <TableRow
                      key={order.id}
                      onClick={() => router.push(href)}
                      className={cn(
                        "h-[61px] cursor-pointer border-ink-200",
                        order.status === "menunggu_konfirmasi"
                          ? "bg-brand-50 hover:bg-brand-100/60"
                          : "hover:bg-ink-50"
                      )}
                    >
                      <TableCell className={cn(BODY_CELL, CODE_CELL)}>
                        <Link
                          href={href}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline"
                        >
                          {order.code}
                        </Link>
                      </TableCell>
                      <TableCell className={BODY_CELL}>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate font-semibold text-ink-900">{order.recipientName}</span>
                          <span className="truncate text-xs text-ink-500">{order.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className={cn(BODY_CELL, "text-ink-600")}>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate">{itemsLabel(order)}</span>
                          <span className="text-xs text-ink-500">{order.itemCount} unit</span>
                        </div>
                      </TableCell>
                      <TableCell className={cn(BODY_CELL, "text-ink-600")}>
                        {FULFILLMENT_LABEL[order.fulfillment]}
                      </TableCell>
                      <TableCell className={cn(BODY_CELL, "text-ink-600")}>
                        {PAYMENT_METHOD_LABEL[order.paymentMethod]}
                      </TableCell>
                      <TableCell className={cn(BODY_CELL, "text-right font-semibold text-ink-900")}>
                        {formatRupiah(order.total)}
                      </TableCell>
                      <TableCell className={BODY_CELL}>
                        <OrderStatusBadge status={order.status} className={FLAT_BADGE} />
                      </TableCell>
                      <TableCell className={cn(BODY_CELL, "text-[13px] text-ink-600")}>
                        {formatWhen(order.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <ListPagination
            page={list.data.page}
            pageCount={list.data.pageCount}
            total={list.data.total}
            onPageChange={(p) => setParams({ page: p })}
          />
        </>
      )}
    </div>
  );
}
