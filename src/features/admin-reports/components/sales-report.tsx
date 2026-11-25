"use client";

import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, subDays } from "date-fns";
import { ChevronDownIcon, FileTextIcon, SheetIcon } from "lucide-react";
import { useState } from "react";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { downloadCsv, toCsv } from "../csv";
import {
  fillRows,
  longLabel,
  resolvePeriod,
  type ReportMode,
  type ReportPeriod,
  type ReportRow,
} from "../period";

const MODES: { value: ReportMode; label: string }[] = [
  { value: "harian", label: "Harian" },
  { value: "bulanan", label: "Bulanan" },
  { value: "rentang", label: "Rentang tanggal" },
];

const FIRST_YEAR = 2024;

const compact = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });

const controlBox =
  "h-9 rounded-[8px] border border-ink-300 bg-white px-3 text-[13px] leading-4 font-semibold text-ink-900 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function compactRupiah(value: number) {
  return `Rp ${compact.format(value)}`;
}

export function SalesReport() {
  const [today] = useState(() => new Date());
  const [mode, setMode] = useState<ReportMode>("bulanan");
  const [month, setMonth] = useState(() => format(today, "yyyy-MM"));
  const [year, setYear] = useState(() => today.getFullYear());
  const [rangeFrom, setRangeFrom] = useState(() => format(subDays(today, 29), "yyyy-MM-dd"));
  const [rangeTo, setRangeTo] = useState(() => format(today, "yyyy-MM-dd"));

  const resolved = resolvePeriod({ mode, month, year, rangeFrom, rangeTo });
  const period = "error" in resolved ? null : resolved;
  const years = Array.from(
    { length: Math.max(today.getFullYear(), year) - FIRST_YEAR + 1 },
    (_, i) => FIRST_YEAR + i
  ).reverse();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold tracking-[-0.6px] text-ink-900 sm:text-[26px] sm:leading-[33px]">
          Laporan Penjualan
        </h1>
        {period ? (
          <div className="flex gap-2.5 print:hidden">
            <Button
              variant="outline"
              className="h-auto gap-2 rounded-[8px] border-ink-300 bg-white px-4 py-[9px] text-sm leading-[17px] font-semibold text-ink-900 hover:bg-ink-50"
              onClick={() => window.print()}
            >
              <FileTextIcon />
              PDF
            </Button>
            <ExportButton period={period} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center print:hidden">
        <div
          role="radiogroup"
          aria-label="Jenis periode"
          className="inline-flex w-full gap-0.5 rounded-[8px] bg-ink-100 p-[3px] sm:w-auto"
        >
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={mode === m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                "flex-1 rounded-[6px] px-3.5 py-[7px] text-[13px] leading-4 whitespace-nowrap transition-colors sm:flex-none",
                mode === m.value
                  ? "bg-white font-semibold text-ink-900 shadow-[0_1px_2px_#1C19171A]"
                  : "font-medium text-ink-600 hover:text-ink-900"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "harian" ? (
          <input
            id="report-month"
            type="month"
            aria-label="Bulan"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className={cn(controlBox, "sm:w-48")}
          />
        ) : null}
        {mode === "bulanan" ? (
          <div className="relative w-full sm:w-auto">
            <select
              id="report-year"
              aria-label="Tahun"
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
              className={cn(controlBox, "w-full cursor-pointer appearance-none pr-[34px]")}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDownIcon
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-ink-500"
            />
          </div>
        ) : null}
        {mode === "rentang" ? (
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <input
              id="report-from"
              type="date"
              aria-label="Dari tanggal"
              value={rangeFrom}
              max={rangeTo || undefined}
              onChange={(e) => setRangeFrom(e.target.value)}
              className={controlBox}
            />
            <input
              id="report-to"
              type="date"
              aria-label="Sampai tanggal"
              value={rangeTo}
              min={rangeFrom || undefined}
              onChange={(e) => setRangeTo(e.target.value)}
              className={controlBox}
            />
          </div>
        ) : null}
      </div>

      {"error" in resolved ? (
        <p className="rounded-[10px] border border-warning-border bg-warning-soft px-4 py-3 text-sm font-medium text-warning">
          {resolved.error}
        </p>
      ) : (
        <ReportBody period={resolved} today={today} />
      )}
    </div>
  );
}

function useSales(period: ReportPeriod) {
  const trpc = useTRPC();
  return useQuery(
    trpc.admin.finance.sales.queryOptions({
      from: period.from,
      to: period.to,
      groupBy: period.groupBy,
    })
  );
}

function ExportButton({ period }: { period: ReportPeriod }) {
  const sales = useSales(period);
  return (
    <Button
      className="h-auto gap-2 rounded-[8px] bg-ink-900 px-4 py-[9px] text-sm leading-[17px] font-semibold text-white hover:bg-ink-800"
      disabled={!sales.data}
      onClick={() => {
        if (!sales.data) return;
        const rows = fillRows(period, sales.data.rows);
        const csv = toCsv([
          ["Periode", "Tanggal", "Total penjualan (Rp)", "Jumlah transaksi"],
          ...rows.map((r) => [longLabel(r, period.groupBy), r.period, r.total, r.transactions]),
          ["Total", "", sales.data.total, sales.data.transactions],
        ]);
        const suffix = `${format(period.from, "yyyyMMdd")}-${format(period.to, "yyyyMMdd")}`;
        downloadCsv(`laporan-penjualan-${period.groupBy === "day" ? "harian" : "bulanan"}-${suffix}.csv`, csv);
      }}
    >
      <SheetIcon />
      Excel
    </Button>
  );
}

function ReportBody({ period, today }: { period: ReportPeriod; today: Date }) {
  const sales = useSales(period);
  const trpc = useTRPC();
  const breakdown = useQuery(
    trpc.admin.finance.breakdown.queryOptions({ from: period.from, to: period.to })
  );

  if (sales.isError) return <ErrorState onRetry={() => sales.refetch()} />;
  if (sales.isPending) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-[123px] rounded-[14px]" />
        <Skeleton className="h-[295px] rounded-[12px]" />
      </div>
    );
  }

  const rows = fillRows(period, sales.data.rows);
  const { total, transactions } = sales.data;
  const average = transactions > 0 ? Math.round(total / transactions) : 0;
  const currentKey = format(period.groupBy === "day" ? today : startOfMonth(today), "yyyy-MM-dd");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid divide-y divide-ink-200 overflow-hidden rounded-[14px] border border-ink-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Kpi label="Total penjualan" value={compactRupiah(total)} hint={period.caption} />
        <Kpi
          label="Jumlah transaksi"
          value={String(transactions)}
          hint="Dibayar, Diproses, dan Selesai"
        />
        <Kpi label="Rata rata per transaksi" value={compactRupiah(average)} />
      </div>
      <p className="hidden text-sm text-ink-600 print:block">{period.caption}</p>

      {transactions === 0 ? (
        <EmptyState
          title="Belum ada penjualan"
          description={`Tidak ada pembayaran diterima pada ${period.caption}.`}
        />
      ) : (
        <>
          <SalesBars rows={rows} groupBy={period.groupBy} currentKey={currentKey} />
          <ReportTable rows={rows} period={period} total={total} transactions={transactions} />
          {breakdown.isError ? (
            <ErrorState onRetry={() => breakdown.refetch()} />
          ) : breakdown.data ? (
            <Breakdown data={breakdown.data} />
          ) : (
            <Skeleton className="h-60 rounded-[12px]" />
          )}
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5 p-[22px]">
      <span className="text-[13px] leading-4 text-ink-600">{label}</span>
      <span className="font-heading text-[28px] leading-9 font-bold tracking-[-0.6px] text-ink-900">
        {value}
      </span>
      {hint ? <span className="text-xs leading-[15px] text-ink-500">{hint}</span> : null}
    </div>
  );
}

function SalesBars({
  rows,
  groupBy,
  currentKey,
}: {
  rows: ReportRow[];
  groupBy: ReportPeriod["groupBy"];
  currentKey: string;
}) {
  const max = Math.max(...rows.map((r) => r.total), 1);
  const dense = rows.length > 12;
  const labelStep = dense ? Math.ceil(rows.length / 10) : 1;
  const gap = dense ? "gap-1" : "gap-1.5 sm:gap-3.5";

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-lg leading-[23px] font-semibold text-ink-900">
        Penjualan per {groupBy === "day" ? "hari" : "bulan"}
      </h2>
      <div className={cn("flex h-60 items-end border-b border-ink-200", gap)}>
        {rows.map((row) => {
          const current = row.period === currentKey && row.total > 0;
          return (
            <div
              key={row.period}
              title={`${longLabel(row, groupBy)}: ${formatRupiah(row.total)}, ${row.transactions} transaksi`}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
            >
              {current ? (
                <span className="text-[11px] leading-[13px] font-bold whitespace-nowrap text-brand-700">
                  {compact.format(row.total)}
                </span>
              ) : null}
              <div
                className={cn(
                  "w-full rounded-t",
                  row.total === 0 ? "bg-ink-200" : current ? "bg-brand-600" : "bg-ink-300"
                )}
                style={{ height: row.total === 0 ? 3 : `${(row.total / max) * 84}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className={cn("flex", gap)}>
        {rows.map((row, i) => (
          <span
            key={row.period}
            className={cn(
              "min-w-0 flex-1 text-center text-[11px] leading-[13px] whitespace-nowrap text-ink-500",
              i % labelStep !== 0 && "invisible",
              !dense && i % 2 === 1 && "max-sm:invisible"
            )}
          >
            {row.label}
          </span>
        ))}
      </div>
    </section>
  );
}

function ReportTable({
  rows,
  period,
  total,
  transactions,
}: {
  rows: ReportRow[];
  period: ReportPeriod;
  total: number;
  transactions: number;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-lg leading-[23px] font-semibold text-ink-900">
        Rincian per {period.groupBy === "day" ? "hari" : "bulan"}
      </h2>
      <div className="overflow-x-auto rounded-[12px] border border-ink-200">
        <table className="w-full min-w-[480px] table-fixed border-collapse text-left">
          <colgroup>
            <col />
            <col className="w-[114px]" />
            <col className="w-[194px]" />
          </colgroup>
          <thead className="bg-ink-50">
            <tr className="border-b border-ink-200 text-xs leading-[15px] font-semibold text-ink-500">
              <th className="py-2.5 pl-5 font-semibold">Periode</th>
              <th className="py-2.5 pl-3.5 font-semibold">Transaksi</th>
              <th className="py-2.5 pr-5 pl-3.5 font-semibold">Penjualan</th>
            </tr>
          </thead>
          <tbody className="text-sm leading-[17px]">
            {rows.map((row) => {
              const empty = row.transactions === 0;
              return (
                <tr key={row.period} className="h-14 border-b border-ink-200">
                  <td
                    className={cn(
                      "truncate pl-5 font-semibold capitalize",
                      empty ? "text-ink-500" : "text-ink-900"
                    )}
                  >
                    {longLabel(row, period.groupBy)}
                  </td>
                  <td className={cn("pl-3.5", empty ? "text-ink-500" : "text-ink-600")}>
                    {row.transactions} trx
                  </td>
                  <td
                    className={cn(
                      "pr-5 pl-3.5 font-semibold",
                      empty ? "text-ink-500" : "text-ink-900"
                    )}
                  >
                    {formatRupiah(row.total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-ink-50 text-sm leading-[17px] font-semibold text-ink-900">
            <tr className="h-14">
              <td className="pl-5">Total</td>
              <td className="pl-3.5">{transactions} trx</td>
              <td className="pr-5 pl-3.5 font-bold">{formatRupiah(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

type BreakdownData = {
  byCategory: { id: string; name: string; revenue: number; units: number }[];
  byProduct: { id: string; name: string; revenue: number; units: number }[];
};

function Breakdown({ data }: { data: BreakdownData }) {
  const { byCategory, byProduct } = data;
  if (byCategory.length === 0 && byProduct.length === 0) return null;
  const topCategory = byCategory[0];
  const totalRevenue = byCategory.reduce((sum, c) => sum + c.revenue, 0);
  const maxRevenue = Math.max(...byCategory.map((c) => c.revenue), 1);

  return (
    <div className="flex flex-col gap-6">
      {topCategory ? (
        <div className="flex flex-col gap-1.5 rounded-[14px] border border-ink-200 p-[22px]">
          <span className="text-[13px] leading-4 text-ink-600">Kategori teratas</span>
          <span className="font-heading text-[22px] leading-7 font-bold text-ink-900">{topCategory.name}</span>
          <span className="text-xs leading-[15px] text-ink-500">
            {formatRupiah(topCategory.revenue)} dari {topCategory.units} unit terjual
          </span>
        </div>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg leading-[23px] font-semibold text-ink-900">Penjualan per kategori</h2>
        <ul className="flex flex-col gap-3.5 rounded-[12px] border border-ink-200 p-5">
          {byCategory.map((c) => (
            <li key={c.id} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm leading-[17px]">
                <span className="truncate font-semibold text-ink-900">{c.name}</span>
                <span className="shrink-0 text-ink-600 tabular-nums">
                  {formatRupiah(c.revenue)}
                  <span className="pl-2 text-xs text-ink-500">
                    {totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 100) : 0}%
                  </span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${(c.revenue / maxRevenue) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg leading-[23px] font-semibold text-ink-900">Produk terlaris</h2>
        <div className="overflow-x-auto rounded-[12px] border border-ink-200">
          <table className="w-full min-w-[480px] border-collapse text-left">
            <thead className="bg-ink-50">
              <tr className="border-b border-ink-200 text-xs leading-[15px] font-semibold text-ink-500">
                <th className="w-12 py-2.5 pl-5 font-semibold">#</th>
                <th className="py-2.5 font-semibold">Produk</th>
                <th className="w-24 py-2.5 text-right font-semibold">Terjual</th>
                <th className="w-44 py-2.5 pr-5 text-right font-semibold">Penjualan</th>
              </tr>
            </thead>
            <tbody className="text-sm leading-[17px]">
              {byProduct.map((p, i) => (
                <tr key={p.id} className="h-12 border-b border-ink-200 last:border-0">
                  <td className="pl-5 text-ink-500 tabular-nums">{i + 1}</td>
                  <td className="truncate pr-3 font-semibold text-ink-900">{p.name}</td>
                  <td className="text-right text-ink-600 tabular-nums">{p.units} unit</td>
                  <td className="pr-5 text-right font-semibold text-ink-900 tabular-nums">{formatRupiah(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
