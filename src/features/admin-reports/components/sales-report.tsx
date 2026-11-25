"use client";

import { useQuery } from "@tanstack/react-query";
import { addDays, addMonths, differenceInCalendarDays, format, subDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  CalendarIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  ReceiptTextIcon,
  WalletIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { AdminHeader, AdminHeaderAction } from "@/components/layout";
import { BottomSheet, SheetClose, SheetRoot } from "@/components/mobile/sheet";
import { ErrorState } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { downloadCsv, toCsv } from "../csv";
import { fillRows, longLabel, resolvePeriod, type ReportMode, type ReportPeriod, type ReportRow } from "../period";
import { buildXlsx, downloadBlob } from "../xlsx";

const MODES: { value: ReportMode; label: string }[] = [
  { value: "harian", label: "Harian" },
  { value: "bulanan", label: "Bulanan" },
  { value: "rentang", label: "Rentang" },
];

function compactRupiah(value: number) {
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  if (value >= 1_000) return `Rp${Math.round(value / 1_000)} rb`;
  return `Rp${value}`;
}

function weekly(rows: ReportRow[]) {
  const buckets: { label: string; total: number; transactions: number }[] = [];
  rows.forEach((r, i) => {
    const w = Math.floor(i / 7);
    buckets[w] ??= { label: `Mgg ${w + 1}`, total: 0, transactions: 0 };
    buckets[w].total += r.total;
    buckets[w].transactions += r.transactions;
  });
  return buckets;
}

function previous(period: ReportPeriod, mode: ReportMode): { from: Date; to: Date } {
  if (mode === "rentang") {
    const days = differenceInCalendarDays(period.to, period.from);
    return { from: addDays(period.from, -days), to: period.from };
  }
  return { from: addMonths(period.from, -1), to: period.from };
}

export function SalesReport() {
  const [today] = useState(() => new Date());
  const [mode, setMode] = useState<ReportMode>("bulanan");
  const [month, setMonth] = useState(() => format(today, "yyyy-MM"));
  const [rangeFrom, setRangeFrom] = useState(() => format(subDays(today, 29), "yyyy-MM-dd"));
  const [rangeTo, setRangeTo] = useState(() => format(today, "yyyy-MM-dd"));
  const [exportOpen, setExportOpen] = useState(false);
  const trpc = useTRPC();

  const resolved = resolvePeriod({
    mode: mode === "rentang" ? "rentang" : "harian",
    month,
    year: today.getFullYear(),
    rangeFrom,
    rangeTo,
  });
  const period = "error" in resolved ? null : resolved;
  const prev = period ? previous(period, mode) : null;

  const sales = useQuery(
    trpc.admin.finance.sales.queryOptions(
      { from: period?.from ?? today, to: period?.to ?? today, groupBy: "day" },
      { enabled: Boolean(period) },
    ),
  );
  const prevSales = useQuery(
    trpc.admin.finance.sales.queryOptions(
      { from: prev?.from ?? today, to: prev?.to ?? today, groupBy: "day" },
      { enabled: Boolean(prev) },
    ),
  );
  const breakdown = useQuery(
    trpc.admin.finance.breakdown.queryOptions(
      { from: period?.from ?? today, to: period?.to ?? today },
      { enabled: Boolean(period) },
    ),
  );

  const rows = period && sales.data ? fillRows(period, sales.data.rows) : [];
  const bars = mode === "bulanan" ? weekly(rows) : rows.map((r) => ({ label: r.label, total: r.total, transactions: r.transactions }));
  const max = Math.max(1, ...bars.map((b) => b.total));
  const peak = bars.reduce((best, b, i) => (b.total > (bars[best]?.total ?? 0) ? i : best), 0);
  const total = sales.data?.total ?? 0;
  const count = sales.data?.transactions ?? 0;
  const prevTotal = prevSales.data?.total ?? 0;
  const delta = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;

  function doCsv() {
    if (!period || !sales.data) return;
    const data = fillRows(period, sales.data.rows);
    downloadCsv(
      `laporan-penjualan-${format(period.from, "yyyyMMdd")}.csv`,
      toCsv([
        ["Periode", "Tanggal", "Total penjualan (Rp)", "Jumlah transaksi"],
        ...data.map((r) => [longLabel(r, "day"), r.period, r.total, r.transactions]),
        ["Total", "", sales.data.total, sales.data.transactions],
      ]),
    );
  }

  function doXlsx() {
    if (!period || !sales.data) return;
    const data = fillRows(period, sales.data.rows);
    downloadBlob(
      `laporan-penjualan-${format(period.from, "yyyyMMdd")}.xlsx`,
      buildXlsx("Penjualan", [
        ["Periode", "Tanggal", "Total penjualan (Rp)", "Jumlah transaksi"],
        ...data.map((r) => [longLabel(r, "day"), r.period, r.total, r.transactions]),
        ["Total", "", sales.data.total, sales.data.transactions],
      ]),
    );
  }

  const exports = [
    { icon: FileTextIcon, title: "Unduh PDF", hint: "Siap cetak dan dibagikan", run: () => window.print() },
    { icon: FileSpreadsheetIcon, title: "Unduh Excel (.xlsx)", hint: "Untuk diolah lebih lanjut", run: doXlsx },
    { icon: DownloadIcon, title: "Unduh CSV", hint: "Data mentah transaksi", run: doCsv },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <AdminHeader
        title="Laporan penjualan"
        right={
          <AdminHeaderAction label="Ekspor" onClick={() => setExportOpen(true)}>
            <DownloadIcon className="size-6" strokeWidth={1.8} />
          </AdminHeaderAction>
        }
      />
      <div role="radiogroup" aria-label="Jenis periode" className="m-3 flex rounded-[10px] bg-ink-100 p-[3px] print:hidden">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={mode === m.value}
            onClick={() => setMode(m.value)}
            className={cn(
              "h-10 flex-1 rounded-lg text-sm font-bold",
              mode === m.value ? "bg-white text-brand-700 shadow-[0_1px_4px_rgba(10,40,70,.15)]" : "text-ink-500",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "rentang" ? (
        <div className="mx-3 grid grid-cols-2 gap-2 print:hidden">
          {(
            [
              ["Dari tanggal", rangeFrom, setRangeFrom, undefined, rangeTo],
              ["Sampai tanggal", rangeTo, setRangeTo, rangeFrom, undefined],
            ] as const
          ).map(([label, value, set, min, maxDate]) => (
            <input
              key={label}
              type="date"
              aria-label={label}
              value={value}
              min={min}
              max={maxDate}
              onChange={(e) => set(e.target.value)}
              className="h-12 rounded-[10px] border-[1.5px] border-ink-200 bg-white px-3 text-sm font-bold text-ink-900"
            />
          ))}
        </div>
      ) : (
        <label className="relative mx-3 flex h-12 items-center gap-2.5 rounded-[10px] border-[1.5px] border-ink-200 bg-white px-3 print:hidden">
          <CalendarIcon className="size-5 text-brand-600" strokeWidth={1.8} />
          <span className="flex-1 text-[15px] font-bold text-ink-900">
            {period ? format(period.from, "MMMM yyyy", { locale: localeId }) : "Pilih bulan"}
          </span>
          <ChevronRightIcon className="size-[18px] rotate-90 text-ink-500" />
          <input
            type="month"
            aria-label="Bulan"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      )}

      {"error" in resolved ? (
        <p className="m-3 rounded-[10px] border border-warning-border bg-warning-soft px-4 py-3 text-sm font-medium text-warning">
          {resolved.error}
        </p>
      ) : sales.isError ? (
        <ErrorState description={sales.error.message} onRetry={() => sales.refetch()} />
      ) : sales.isPending ? (
        <div role="status" className="flex flex-col gap-2.5 p-3">
          <div className="grid grid-cols-2 gap-2.5">
            <Skeleton className="h-[104px] rounded-xl" />
            <Skeleton className="h-[104px] rounded-xl" />
          </div>
          <Skeleton className="h-[200px] rounded-xl" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 p-3">
            <div className="flex flex-col gap-1.5 rounded-xl border border-ink-200 bg-white p-3">
              <div className="flex items-center gap-2">
                <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-success-soft">
                  <WalletIcon className="size-5 text-success" strokeWidth={2} />
                </span>
                <p className="text-xs font-medium text-ink-500">Total penjualan</p>
              </div>
              <p className="text-2xl font-bold text-ink-900">{compactRupiah(total).replace(".", ",")}</p>
              <p className={cn("text-xs font-medium", delta !== null && delta < 0 ? "text-error" : "text-success")}>
                {delta === null
                  ? "Belum ada pembanding"
                  : `${delta >= 0 ? "+" : ""}${delta}% dari ${mode === "rentang" ? "periode" : "bulan"} lalu`}
              </p>
            </div>
            <div className="flex flex-col gap-1.5 rounded-xl border border-ink-200 bg-white p-3">
              <div className="flex items-center gap-2">
                <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-brand-100">
                  <ReceiptTextIcon className="size-5 text-brand-600" strokeWidth={2} />
                </span>
                <p className="text-xs font-medium text-ink-500">Jumlah transaksi</p>
              </div>
              <p className="text-2xl font-bold text-ink-900">{count}</p>
              <p className="text-xs font-medium text-brand-600">
                Rata-rata {count > 0 ? compactRupiah(Math.round(total / count)) : "Rp0"}
              </p>
            </div>
          </div>

          <section className="mx-3 flex flex-col gap-2 rounded-xl border border-ink-200 bg-white p-3.5">
            <h2 className="text-[15px] font-bold text-ink-900">
              {mode === "bulanan" ? "Penjualan per minggu" : "Penjualan per hari"}
            </h2>
            <div className={cn("flex items-end", mode === "bulanan" ? "gap-2" : "gap-0.5")}>
              {bars.map((b, i) => (
                <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-[130px] w-full items-end" title={formatRupiah(b.total)}>
                    <div
                      className={cn("w-full rounded-t-md", i === peak && b.total > 0 ? "bg-brand-600" : "bg-brand-200")}
                      style={{ height: `${Math.max(2, (b.total / max) * 100)}%` }}
                    />
                  </div>
                  {mode === "bulanan" || bars.length <= 10 ? (
                    <p className="text-[11px] font-medium text-ink-500">{b.label}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="m-3 flex flex-col rounded-xl border border-ink-200 bg-white p-3.5">
            <h2 className="text-[15px] font-bold text-ink-900">Produk terlaris</h2>
            {breakdown.data && breakdown.data.byProduct.length > 0 ? (
              breakdown.data.byProduct.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center gap-2 border-b border-ink-200 py-2.5 last:border-b-0">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900">{p.name}</p>
                  <p className="w-12 text-right text-[13px] text-ink-500">{p.units}</p>
                  <p className="w-24 text-right text-sm font-bold text-ink-900">{compactRupiah(p.revenue).replace(".", ",")}</p>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-ink-500">Belum ada penjualan pada periode ini.</p>
            )}
          </section>
        </>
      )}

      <SheetRoot open={exportOpen} onOpenChange={setExportOpen}>
        <BottomSheet title="Ekspor laporan">
          <div className="flex h-12 items-center gap-1 pr-2 pl-4">
            <p className="flex-1 text-[17px] font-bold text-ink-900">Ekspor laporan</p>
            <SheetClose aria-label="Tutup" className="flex size-10 items-center justify-center rounded-full text-ink-500">
              <XIcon className="size-6" strokeWidth={1.8} />
            </SheetClose>
          </div>
          <div className="flex flex-col px-4 pb-6">
            {exports.map(({ icon: Icon, title, hint, run }) => (
              <button
                key={title}
                type="button"
                disabled={!sales.data}
                onClick={() => {
                  setExportOpen(false);
                  setTimeout(run, 150);
                }}
                className="flex items-center gap-3 border-b border-ink-200 py-2 text-left last:border-b-0 disabled:opacity-50"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-100">
                  <Icon className="size-6 text-brand-600" strokeWidth={1.8} />
                </span>
                <span className="flex flex-1 flex-col gap-px">
                  <span className="text-[15px] font-bold text-ink-900">{title}</span>
                  <span className="text-xs text-ink-500">{hint}</span>
                </span>
                <ChevronRightIcon className="size-[18px] text-ink-500" />
              </button>
            ))}
          </div>
        </BottomSheet>
      </SheetRoot>
    </div>
  );
}
