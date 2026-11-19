"use client";

import { useQuery } from "@tanstack/react-query";
import { addDays, endOfDay, isValid, parse, startOfDay } from "date-fns";
import Link from "next/link";
import { EmptyState, ErrorState, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDayTime,
  ListPagination,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  PaymentStatusBadge,
  readPage,
  useSearchParamState,
  type PaymentMethod,
  type PaymentStatus,
} from "@/features/admin-orders";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

const PAGE_SIZE = 20;
const METHODS: PaymentMethod[] = ["transfer", "tunai"];
const STATUSES: PaymentStatus[] = ["menunggu", "diterima", "ditolak"];

function parseDay(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = parse(value, "yyyy-MM-dd", new Date());
  return isValid(date) ? date : undefined;
}

export function TransactionList() {
  const trpc = useTRPC();
  const { searchParams, setParams } = useSearchParamState();
  const rawMethod = searchParams.get("metode");
  const method = METHODS.find((m) => m === rawMethod);
  const rawStatus = searchParams.get("status");
  const status = STATUSES.find((s) => s === rawStatus);
  const fromValue = searchParams.get("dari") ?? "";
  const toValue = searchParams.get("sampai") ?? "";
  const fromDay = parseDay(fromValue);
  const toDay = parseDay(toValue);
  const page = readPage(searchParams.get("page"));

  const list = useQuery(
    trpc.admin.finance.transactions.queryOptions({
      method,
      status,
      from: fromDay ? startOfDay(fromDay) : undefined,
      to: toDay ? endOfDay(toDay) : undefined,
      page,
      pageSize: PAGE_SIZE,
    })
  );

  const summary = useQuery(
    trpc.admin.finance.sales.queryOptions({
      from: fromDay ? startOfDay(fromDay) : new Date(0),
      to: addDays(startOfDay(toDay ?? new Date()), 1),
      groupBy: "month",
    })
  );

  const hasFilter = Boolean(method || status || fromDay || toDay);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Transaksi" description="Semua pembayaran tunai dan transfer pelanggan" />

      <section className="flex flex-col gap-1 rounded-2xl border border-ink-200 bg-white p-5 sm:p-6">
        <span className="text-[13px] text-ink-500">
          Dana masuk terkonfirmasi{fromDay || toDay ? " pada rentang tanggal" : ""}
        </span>
        {summary.isPending ? (
          <Skeleton className="h-10 w-56" />
        ) : summary.isError ? (
          <span className="text-sm text-error">Ringkasan gagal dimuat</span>
        ) : (
          <>
            <span className="font-heading text-3xl font-bold text-ink-900 sm:text-4xl">
              {formatRupiah(summary.data.total)}
            </span>
            <span className="text-[13px] text-ink-600">
              Dari {summary.data.transactions} pesanan, semua metode pembayaran
            </span>
          </>
        )}
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {[undefined, ...METHODS].map((m) => {
            const active = m === method;
            return (
              <button
                key={m ?? "semua"}
                type="button"
                aria-pressed={active}
                onClick={() => setParams({ metode: m ?? null, page: null })}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-medium transition-colors",
                  active
                    ? "border-ink-900 bg-ink-900 text-white"
                    : "border-ink-200 bg-white text-ink-900 hover:bg-ink-50"
                )}
              >
                {m ? PAYMENT_METHOD_LABEL[m] : "Semua metode"}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
          <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
            <Label htmlFor="trx-status" className="text-xs text-ink-500">
              Status
            </Label>
            <NativeSelect
              id="trx-status"
              value={status ?? ""}
              onChange={(e) => setParams({ status: e.target.value || null, page: null })}
              className="bg-white"
            >
              <NativeSelectOption value="">Semua status</NativeSelectOption>
              {STATUSES.map((s) => (
                <NativeSelectOption key={s} value={s}>
                  {PAYMENT_STATUS_LABEL[s]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="trx-from" className="text-xs text-ink-500">
              Dari tanggal
            </Label>
            <Input
              id="trx-from"
              type="date"
              value={fromValue}
              max={toValue || undefined}
              onChange={(e) => setParams({ dari: e.target.value || null, page: null })}
              className="bg-white"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="trx-to" className="text-xs text-ink-500">
              Sampai tanggal
            </Label>
            <Input
              id="trx-to"
              type="date"
              value={toValue}
              min={fromValue || undefined}
              onChange={(e) => setParams({ sampai: e.target.value || null, page: null })}
              className="bg-white"
            />
          </div>
          {hasFilter ? (
            <Button
              variant="ghost"
              className="col-span-2 sm:col-span-1"
              onClick={() =>
                setParams({ metode: null, status: null, dari: null, sampai: null, page: null })
              }
            >
              Reset filter
            </Button>
          ) : null}
        </div>
      </div>

      {list.isError ? (
        <ErrorState onRetry={() => list.refetch()} />
      ) : list.isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : list.data.items.length === 0 ? (
        <EmptyState
          title="Belum ada transaksi"
          description={
            hasFilter
              ? "Tidak ada transaksi yang cocok dengan filter ini."
              : "Pembayaran pelanggan akan tercatat di sini."
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
            <Table>
              <TableHeader className="bg-ink-50">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-ink-500">Tanggal</TableHead>
                  <TableHead className="text-xs font-semibold text-ink-500">Pesanan</TableHead>
                  <TableHead className="text-xs font-semibold text-ink-500">Metode</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-ink-500">
                    Nominal
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-ink-500">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-ink-500">Dikonfirmasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.items.map((trx) => (
                  <TableRow key={trx.id}>
                    <TableCell className="text-ink-600">{formatDayTime(trx.createdAt)}</TableCell>
                    <TableCell className="text-[13px] font-semibold text-ink-900">
                      <Link
                        href={`/admin/pesanan/${encodeURIComponent(trx.orderCode)}`}
                        className="hover:underline"
                      >
                        {trx.orderCode}
                      </Link>
                    </TableCell>
                    <TableCell className="text-ink-600">
                      {PAYMENT_METHOD_LABEL[trx.method]}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-ink-900">
                      {formatRupiah(trx.amount)}
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={trx.status} />
                    </TableCell>
                    <TableCell className="text-ink-500">
                      {trx.confirmedAt ? formatDayTime(trx.confirmedAt) : "Belum"}
                    </TableCell>
                  </TableRow>
                ))}
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
