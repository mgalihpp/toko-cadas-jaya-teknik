"use client";

import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, endOfDay, isValid, parse, startOfDay } from "date-fns";
import { CalendarIcon, DownloadIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import {
  adminTableStyles as s,
  downloadCsv,
  fetchAllPages,
  formatDayTime,
  formatFullStamp,
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

const dayMonthYear = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function parseDay(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = parse(value, "yyyy-MM-dd", new Date());
  return isValid(date) ? date : undefined;
}

function rangeLabel(from: Date | undefined, to: Date | undefined): string {
  if (from && to) {
    const sameMonth =
      from.getFullYear() === to.getFullYear() &&
      from.getMonth() === to.getMonth();
    return sameMonth
      ? `${from.getDate()} sampai ${dayMonthYear.format(to)}`
      : `${dayMonthYear.format(from)} sampai ${dayMonthYear.format(to)}`;
  }
  if (from) return `Sejak ${dayMonthYear.format(from)}`;
  if (to) return `Sampai ${dayMonthYear.format(to)}`;
  return "Semua tanggal";
}

export function TransactionList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { searchParams, setParams } = useSearchParamState();
  const rawMethod = searchParams.get("metode");
  const method = METHODS.find((m) => m === rawMethod);
  const rawStatus = searchParams.get("status");
  const status = STATUSES.find((st) => st === rawStatus);
  const fromValue = searchParams.get("dari") ?? "";
  const toValue = searchParams.get("sampai") ?? "";
  const fromDay = parseDay(fromValue);
  const toDay = parseDay(toValue);
  const page = readPage(searchParams.get("page"));
  const [exporting, setExporting] = useState(false);

  const range = {
    from: fromDay ? startOfDay(fromDay) : undefined,
    to: toDay ? endOfDay(toDay) : undefined,
  };
  const filter = { method, status, ...range };

  const list = useQuery(
    trpc.admin.finance.transactions.queryOptions({
      ...filter,
      page,
      pageSize: PAGE_SIZE,
    }),
  );

  const summary = useQuery(
    trpc.admin.finance.sales.queryOptions({
      from: fromDay ? startOfDay(fromDay) : new Date(0),
      to: addDays(startOfDay(toDay ?? new Date()), 1),
      groupBy: "month",
    }),
  );

  const [transferCount, cashCount, pendingCount] = useQueries({
    queries: [
      { method: "transfer" as const, status: "diterima" as const },
      { method: "tunai" as const, status: "diterima" as const },
      { method: undefined, status: "menunggu" as const },
    ].map((f) =>
      trpc.admin.finance.transactions.queryOptions({
        ...f,
        ...range,
        pageSize: 1,
      }),
    ),
  }).map((q) => q.data?.total);

  const hasFilter = Boolean(method || status || fromDay || toDay);
  const confirmedCount = (transferCount ?? 0) + (cashCount ?? 0);
  const transferShare = confirmedCount
    ? ((transferCount ?? 0) / confirmedCount) * 100
    : 0;

  async function exportCsv() {
    setExporting(true);
    try {
      const rows = await fetchAllPages((p) =>
        queryClient.fetchQuery(
          trpc.admin.finance.transactions.queryOptions({
            ...filter,
            page: p,
            pageSize: 100,
          }),
        ),
      );
      downloadCsv(
        "transaksi.csv",
        ["Tanggal", "Pesanan", "Pelanggan", "Metode", "Nominal", "Status", "Dikonfirmasi", "Dikonfirmasi oleh"],
        rows.map((t) => [
          formatFullStamp(t.createdAt),
          t.orderCode,
          t.customerName,
          PAYMENT_METHOD_LABEL[t.method],
          t.amount,
          PAYMENT_STATUS_LABEL[t.status],
          t.confirmedAt ? formatFullStamp(t.confirmedAt) : "",
          t.confirmedByName ?? "",
        ]),
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
        <h1 className={s.PAGE_TITLE}>Transaksi</h1>
        <div className="flex flex-wrap items-center gap-2.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={s.OUTLINE_ACTION}>
                <CalendarIcon />
                {rangeLabel(fromDay, toDay)}
                {method || status ? (
                  <span
                    className="size-1.5 rounded-full bg-brand-600"
                    aria-label="Filter aktif"
                  />
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 gap-4 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="trx-from" className="text-xs text-ink-500">
                    Dari tanggal
                  </Label>
                  <Input
                    id="trx-from"
                    type="date"
                    value={fromValue}
                    max={toValue || undefined}
                    onChange={(e) =>
                      setParams({ dari: e.target.value || null, page: null })
                    }
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
                    onChange={(e) =>
                      setParams({ sampai: e.target.value || null, page: null })
                    }
                    className="bg-white"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-ink-500">Metode</span>
                <div className="flex flex-wrap gap-2">
                  {[undefined, ...METHODS].map((m) => {
                    const active = m === method;
                    return (
                      <button
                        key={m ?? "semua"}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          setParams({ metode: m ?? null, page: null })
                        }
                        className={cn(
                          "inline-flex h-[30px] items-center rounded-full border px-3 text-[13px] font-medium transition-colors",
                          active
                            ? "border-ink-900 bg-ink-900 text-white"
                            : "border-ink-200 bg-white text-ink-900 hover:bg-ink-50",
                        )}
                      >
                        {m ? PAYMENT_METHOD_LABEL[m] : "Semua metode"}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="trx-status" className="text-xs text-ink-500">
                  Status
                </Label>
                <NativeSelect
                  id="trx-status"
                  value={status ?? ""}
                  onChange={(e) =>
                    setParams({ status: e.target.value || null, page: null })
                  }
                  className="bg-white"
                >
                  <NativeSelectOption value="">Semua status</NativeSelectOption>
                  {STATUSES.map((st) => (
                    <NativeSelectOption key={st} value={st}>
                      {PAYMENT_STATUS_LABEL[st]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              {hasFilter ? (
                <Button
                  variant="ghost"
                  onClick={() =>
                    setParams({
                      metode: null,
                      status: null,
                      dari: null,
                      sampai: null,
                      page: null,
                    })
                  }
                >
                  Reset filter
                </Button>
              ) : null}
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            className={s.OUTLINE_ACTION}
            onClick={exportCsv}
            disabled={exporting}
          >
            {exporting ? <Spinner /> : <DownloadIcon />}
            Ekspor
          </Button>
        </div>
      </div>

      <section className="flex flex-col gap-6 border-b border-ink-200 pt-1 pb-5 lg:flex-row lg:items-end lg:gap-12">
        <div className="flex shrink-0 flex-col gap-1">
          <span className="text-[13px] leading-4 text-ink-500">
            Dana masuk terkonfirmasi
            {fromDay || toDay ? " pada rentang tanggal" : ""}
          </span>
          {summary.isPending ? (
            <Skeleton className="h-[51px] w-64" />
          ) : summary.isError ? (
            <span className="text-sm text-error">Ringkasan gagal dimuat</span>
          ) : (
            <span className="font-heading text-[40px] leading-[51px] font-bold tracking-[-1.2px] text-ink-900">
              {formatRupiah(summary.data.total)}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2.5 pb-2">
          <div className="flex h-2.5 overflow-hidden rounded-full bg-ink-200">
            {confirmedCount ? (
              <>
                <div
                  className="bg-brand-600"
                  style={{ width: `${transferShare}%` }}
                />
                <div className="flex-1 bg-ink-900" />
              </>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Legend
              swatch="bg-brand-600"
              label="Transfer"
              value={transferCount}
              unit="transaksi"
            />
            <Legend
              swatch="bg-ink-900"
              label="Tunai"
              value={cashCount}
              unit="transaksi"
            />
            <Legend
              swatch="bg-info"
              label="Menunggu"
              value={pendingCount}
              unit="bukti"
            />
          </div>
        </div>
      </section>

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
          <div className={s.TABLE_FRAME}>
            <Table className="min-w-[1080px] table-fixed">
              <TableHeader>
                <TableRow className={s.HEAD_ROW}>
                  <TableHead className={cn(s.HEAD_CELL, "w-[170px]")}>
                    Tanggal
                  </TableHead>
                  <TableHead className={cn(s.HEAD_CELL, "w-[200px]")}>
                    Pesanan
                  </TableHead>
                  <TableHead className={cn(s.HEAD_CELL, "w-[160px]")}>
                    Pelanggan
                  </TableHead>
                  <TableHead className={cn(s.HEAD_CELL, "w-[154px]")}>
                    Metode
                  </TableHead>
                  <TableHead
                    className={cn(s.HEAD_CELL, "w-[154px] text-right")}
                  >
                    Nominal
                  </TableHead>
                  <TableHead className={cn(s.HEAD_CELL, "w-[144px]")}>
                    Status
                  </TableHead>
                  <TableHead className={cn(s.HEAD_CELL, "w-[220px]")}>
                    Dikonfirmasi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.items.map((trx) => (
                  <TableRow
                    key={trx.id}
                    className="h-[48px] border-ink-200 hover:bg-ink-50"
                  >
                    <TableCell className={cn(s.BODY_CELL, "text-ink-600")}>
                      {formatDayTime(trx.createdAt)}
                    </TableCell>
                    <TableCell className={cn(s.BODY_CELL, s.CODE_CELL)}>
                      <Link
                        href={`/admin/pesanan/${encodeURIComponent(trx.orderCode)}`}
                        className="hover:underline"
                      >
                        {trx.orderCode}
                      </Link>
                    </TableCell>
                    <TableCell className={cn(s.BODY_CELL, "truncate font-medium text-ink-900")}>
                      {trx.customerName}
                    </TableCell>
                    <TableCell className={cn(s.BODY_CELL, "text-ink-600")}>
                      {PAYMENT_METHOD_LABEL[trx.method]}
                    </TableCell>
                    <TableCell
                      className={cn(
                        s.BODY_CELL,
                        "text-right font-semibold text-ink-900",
                      )}
                    >
                      {formatRupiah(trx.amount)}
                    </TableCell>
                    <TableCell className={s.BODY_CELL}>
                      <PaymentStatusBadge status={trx.status} />
                    </TableCell>
                    <TableCell
                      className={cn(
                        s.BODY_CELL,
                        trx.confirmedAt ? "text-ink-600" : "text-ink-500",
                      )}
                    >
                      {trx.confirmedAt ? (
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span>{formatDayTime(trx.confirmedAt)}</span>
                          {trx.confirmedByName ? (
                            <span className="truncate text-xs text-ink-500">oleh {trx.confirmedByName}</span>
                          ) : null}
                        </div>
                      ) : (
                        "Belum"
                      )}
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

function Legend({
  swatch,
  label,
  value,
  unit,
}: {
  swatch: string;
  label: string;
  value: number | undefined;
  unit: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[13px] leading-4">
      <span className={cn("size-2.5 rounded-[2px]", swatch)} aria-hidden />
      <span className="font-semibold text-ink-900">{label}</span>
      <span className="text-ink-600">
        {value === undefined ? "..." : `${value} ${unit}`}
      </span>
    </div>
  );
}
