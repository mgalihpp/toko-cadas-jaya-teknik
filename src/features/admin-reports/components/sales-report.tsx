"use client";

import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { DownloadIcon } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { EmptyState, ErrorState, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const chartConfig = {
  total: { label: "Penjualan", color: "var(--chart-1)" },
} satisfies ChartConfig;

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
      <PageHeader
        title="Laporan Penjualan"
        description="Dihitung dari pembayaran yang sudah diterima (pesanan Dibayar, Diproses, dan Selesai)"
        actions={period ? <ExportButton period={period} /> : null}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div
          role="radiogroup"
          aria-label="Jenis periode"
          className="inline-flex w-full rounded-lg bg-ink-100 p-1 sm:w-auto"
        >
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={mode === m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                "h-8 flex-1 rounded-md px-3 text-[13px] whitespace-nowrap transition-colors sm:flex-none",
                mode === m.value
                  ? "bg-white font-semibold text-ink-900 shadow-sm"
                  : "font-medium text-ink-600 hover:text-ink-900"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "harian" ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="report-month" className="text-xs text-ink-500">
              Bulan
            </Label>
            <Input
              id="report-month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-white sm:w-48"
            />
          </div>
        ) : null}
        {mode === "bulanan" ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="report-year" className="text-xs text-ink-500">
              Tahun
            </Label>
            <NativeSelect
              id="report-year"
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-white"
            >
              {years.map((y) => (
                <NativeSelectOption key={y} value={y}>
                  {y}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        ) : null}
        {mode === "rentang" ? (
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="report-from" className="text-xs text-ink-500">
                Dari tanggal
              </Label>
              <Input
                id="report-from"
                type="date"
                value={rangeFrom}
                max={rangeTo || undefined}
                onChange={(e) => setRangeFrom(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="report-to" className="text-xs text-ink-500">
                Sampai tanggal
              </Label>
              <Input
                id="report-to"
                type="date"
                value={rangeTo}
                min={rangeFrom || undefined}
                onChange={(e) => setRangeTo(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
        ) : null}
      </div>

      {"error" in resolved ? (
        <p className="rounded-xl border border-warning-border bg-warning-soft px-4 py-3 text-sm font-medium text-warning">
          {resolved.error}
        </p>
      ) : (
        <ReportBody period={resolved} />
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
      variant="outline"
      className="bg-white"
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
      <DownloadIcon />
      Ekspor CSV
    </Button>
  );
}

function ReportBody({ period }: { period: ReportPeriod }) {
  const sales = useSales(period);

  if (sales.isError) return <ErrorState onRetry={() => sales.refetch()} />;
  if (sales.isPending) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  const rows = fillRows(period, sales.data.rows);
  const { total, transactions } = sales.data;
  const average = transactions > 0 ? Math.round(total / transactions) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Total penjualan" value={formatRupiah(total)} hint={period.caption} />
        <Kpi
          label="Jumlah transaksi"
          value={String(transactions)}
          hint="Dibayar, diproses, dan selesai"
        />
        <Kpi
          label="Rata rata per transaksi"
          value={formatRupiah(average)}
          hint={transactions > 0 ? "Total dibagi jumlah transaksi" : "Belum ada transaksi"}
        />
      </div>

      {transactions === 0 ? (
        <EmptyState
          title="Belum ada penjualan"
          description={`Tidak ada pembayaran diterima pada ${period.caption}.`}
        />
      ) : (
        <>
          <SalesChart rows={rows} groupBy={period.groupBy} />
          <ReportTable rows={rows} period={period} total={total} transactions={transactions} />
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-ink-200 bg-white p-5">
      <span className="text-[13px] text-ink-600">{label}</span>
      <span className="font-heading text-2xl font-bold text-ink-900 sm:text-[28px]">{value}</span>
      <span className="text-xs text-ink-500">{hint}</span>
    </div>
  );
}

function SalesChart({ rows, groupBy }: { rows: ReportRow[]; groupBy: ReportPeriod["groupBy"] }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-ink-200 bg-white p-4 sm:p-6">
      <h2 className="font-heading text-lg font-semibold text-ink-900">
        Penjualan per {groupBy === "day" ? "hari" : "bulan"}
      </h2>
      <ChartContainer config={chartConfig} className="h-72 w-full">
        <BarChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v: number) => compact.format(v)}
          />
          <ChartTooltip
            cursor={{ fill: "var(--color-ink-100)" }}
            content={
              <ChartTooltipContent
                formatter={(value, _name, item) => (
                  <div className="flex w-full flex-col gap-0.5">
                    <span className="font-mono font-medium text-foreground tabular-nums">
                      {formatRupiah(Number(value))}
                    </span>
                    <span className="text-muted-foreground">
                      {(item.payload as ReportRow).transactions} transaksi
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
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
    <section className="overflow-hidden rounded-xl border border-ink-200 bg-white">
      <Table>
        <TableHeader className="bg-ink-50">
          <TableRow>
            <TableHead className="text-xs font-semibold text-ink-500">Periode</TableHead>
            <TableHead className="text-right text-xs font-semibold text-ink-500">
              Transaksi
            </TableHead>
            <TableHead className="text-right text-xs font-semibold text-ink-500">
              Penjualan
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.period} className={row.transactions === 0 ? "text-ink-500" : undefined}>
              <TableCell className="capitalize">{longLabel(row, period.groupBy)}</TableCell>
              <TableCell className="text-right">{row.transactions}</TableCell>
              <TableCell className="text-right font-semibold">{formatRupiah(row.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-semibold">Total</TableCell>
            <TableCell className="text-right font-semibold">{transactions}</TableCell>
            <TableCell className="text-right font-bold">{formatRupiah(total)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </section>
  );
}
