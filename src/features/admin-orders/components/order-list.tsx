"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  EmptyState,
  ErrorState,
  ORDER_STATUS_LABEL,
  OrderStatusBadge,
  PageHeader,
  type OrderStatus,
} from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { formatWhen } from "../format";
import { readPage, useSearchParamState } from "../hooks/use-search-param-state";
import {
  FULFILLMENT_LABEL,
  isOrderStatus,
  ORDER_STATUS_ORDER,
  PAYMENT_METHOD_LABEL,
} from "../labels";
import { ListPagination } from "./list-pagination";

const PAGE_SIZE = 20;

export function AdminOrderList() {
  const trpc = useTRPC();
  const router = useRouter();
  const { searchParams, setParams } = useSearchParamState();
  const rawStatus = searchParams.get("status");
  const status = isOrderStatus(rawStatus) ? rawStatus : undefined;
  const q = searchParams.get("q") ?? "";
  const page = readPage(searchParams.get("page"));
  const [search, setSearch] = useState(q);

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
    queries: filters.map((s) =>
      trpc.admin.orders.list.queryOptions({ status: s, pageSize: 1 })
    ),
  });
  const totalAll = counts[0]?.data?.total;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pesanan"
        description={
          totalAll === undefined ? "Memuat jumlah pesanan" : `${totalAll} pesanan tercatat`
        }
        actions={
          <form
            className="relative w-full sm:w-72"
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
              className="h-9 bg-white pl-9"
            />
          </form>
        }
      />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
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
                "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
                active
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-200 bg-white text-ink-900 hover:bg-ink-50"
              )}
            >
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
          <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
            <Table>
              <TableHeader className="bg-ink-50">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-ink-500">Kode</TableHead>
                  <TableHead className="text-xs font-semibold text-ink-500">Penerima</TableHead>
                  <TableHead className="text-xs font-semibold text-ink-500">Pengambilan</TableHead>
                  <TableHead className="text-xs font-semibold text-ink-500">Metode</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-ink-500">
                    Total
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-ink-500">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-ink-500">Masuk</TableHead>
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
                        "cursor-pointer",
                        order.status === "menunggu_konfirmasi" && "bg-brand-50 hover:bg-brand-100/60"
                      )}
                    >
                      <TableCell className="text-[13px] font-semibold text-ink-900">
                        <Link href={href} onClick={(e) => e.stopPropagation()} className="hover:underline">
                          {order.code}
                        </Link>
                      </TableCell>
                      <TableCell className="font-semibold text-ink-900">
                        {order.recipientName}
                      </TableCell>
                      <TableCell className="text-ink-600">
                        {FULFILLMENT_LABEL[order.fulfillment]}
                      </TableCell>
                      <TableCell className="text-ink-600">
                        {PAYMENT_METHOD_LABEL[order.paymentMethod]}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-ink-900">
                        {formatRupiah(order.total)}
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-[13px] text-ink-600">
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
