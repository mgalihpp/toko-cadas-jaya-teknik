"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  FileCheckIcon,
  PackageIcon,
  PlusIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { io } from "next/cache";
import Link from "next/link";
import { use, useState } from "react";
import { ErrorState, OrderStatusBadge } from "@/components/shared";
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
import { useSession } from "@/lib/auth-client";
import { formatDate, formatDateTime, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { SalesChart, type SalesPoint } from "./sales-chart";

const DAY = 86_400_000;
const SALES_DAYS = 30;
const CHART_DAYS = 14;
const jakartaDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const shortDay = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric" });

function greeting(date: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "numeric", hourCycle: "h23" }).format(date)
  );
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export function AdminDashboard() {
  use(io());
  const trpc = useTRPC();
  const { data: session } = useSession();
  const [range] = useState(() => {
    const hour = 3_600_000;
    const to = new Date(Math.ceil(Date.now() / hour) * hour);
    return { from: new Date(to.getTime() - SALES_DAYS * DAY), to };
  });

  const dashboard = useQuery(trpc.admin.finance.dashboard.queryOptions());
  const sales = useQuery(trpc.admin.finance.sales.queryOptions({ ...range, groupBy: "day" }));
  const confirmations = useQuery(
    trpc.admin.orders.list.queryOptions({ status: "menunggu_konfirmasi", pageSize: 5 })
  );

  const chartData: SalesPoint[] = (() => {
    const totals = new Map(sales.data?.rows.map((r) => [r.period, r.total]));
    return Array.from({ length: CHART_DAYS }, (_, i) => {
      const date = new Date(range.to.getTime() - (CHART_DAYS - 1 - i) * DAY - 1);
      const key = jakartaDay.format(date);
      return { key: formatDate(date), label: shortDay.format(date), total: totals.get(key) ?? 0 };
    });
  })();

  const now = new Date();
  const d = dashboard.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1
            className="font-heading text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl"
            suppressHydrationWarning
          >
            {greeting(now)}
            {session?.user.name ? `, ${session.user.name}` : ""}
          </h1>
          <p className="text-sm text-ink-500" suppressHydrationWarning>
            {new Intl.DateTimeFormat("id-ID", {
              timeZone: "Asia/Jakarta",
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(now)}
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/admin/produk/baru">
            <PlusIcon />
            Tambah Produk
          </Link>
        </Button>
      </div>

      {dashboard.isError ? (
        <ErrorState description={dashboard.error.message} onRetry={() => dashboard.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-ink-200 bg-white lg:grid-cols-4">
            <Kpi
              label="Penjualan"
              value={sales.data ? formatRupiah(sales.data.total) : undefined}
              hint={sales.data ? `${sales.data.transactions} transaksi, 30 hari terakhir` : "30 hari terakhir"}
            />
            <Kpi
              label="Pesanan perlu diproses"
              value={d?.inProcess}
              hint={d ? `${d.awaitingPayment} menunggu pembayaran` : undefined}
            />
            <Kpi
              label="Menunggu konfirmasi"
              value={d?.awaitingConfirmation}
              hint="bukti transfer perlu dicek"
              tone={d && d.awaitingConfirmation > 0 ? "info" : undefined}
            />
            <Kpi
              label="Stok menipis"
              value={d?.lowStock.length}
              hint="tersedia 2 unit atau kurang"
              tone={d && d.lowStock.length > 0 ? "warning" : undefined}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card title="Penjualan 14 hari">
              {sales.isError ? (
                <p className="py-16 text-center text-sm text-ink-500">Grafik penjualan gagal dimuat.</p>
              ) : sales.data ? (
                <SalesChart data={chartData} />
              ) : (
                <Skeleton className="h-64 w-full" />
              )}
            </Card>

            <Card
              title="Perlu tindakan"
              action={
                <Link href="/admin/pesanan" className="text-sm font-medium text-brand-600 hover:underline">
                  Lihat semua
                </Link>
              }
            >
              <ActionList
                loading={!d || !confirmations.data}
                orders={confirmations.data?.items ?? []}
                lowStock={d?.lowStock ?? []}
              />
            </Card>
          </div>

          <Card
            title="Pesanan terbaru"
            action={
              <Link
                href="/admin/pesanan"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
              >
                Semua pesanan
                <ArrowRightIcon className="size-3.5" />
              </Link>
            }
            flush
          >
            {d && d.latestSales.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-ink-500">Belum ada penjualan.</p>
            ) : (
              <Table>
                <TableHeader className="bg-ink-50">
                  <TableRow>
                    <TableHead className="pl-5">Kode</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-5 text-right">Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d
                    ? d.latestSales.map((o) => (
                        <TableRow key={o.code}>
                          <TableCell className="pl-5 font-mono text-xs font-medium">
                            <Link href={`/admin/pesanan/${o.code}`} className="text-ink-900 hover:text-brand-600">
                              {o.code}
                            </Link>
                          </TableCell>
                          <TableCell>{o.recipientName}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatRupiah(o.total)}
                          </TableCell>
                          <TableCell>
                            <OrderStatusBadge status={o.status} />
                          </TableCell>
                          <TableCell className="pr-5 text-right text-ink-500">
                            {formatDateTime(o.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    : Array.from({ length: 4 }, (_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={5} className="px-5">
                            <Skeleton className="h-7 w-full" />
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: React.ReactNode | undefined;
  hint?: string;
  tone?: "info" | "warning";
}) {
  return (
    <div className="flex flex-col gap-1 border-ink-200 p-4 not-last:border-r max-lg:nth-2:border-r-0 max-lg:nth-[-n+2]:border-b sm:p-5">
      <span className="text-sm text-ink-500">{label}</span>
      {value === undefined ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <span
          className={cn(
            "font-heading text-2xl font-bold text-ink-900 tabular-nums sm:text-3xl",
            tone === "info" && "text-info",
            tone === "warning" && "text-warning"
          )}
        >
          {value}
        </span>
      )}
      {hint ? <span className="text-xs text-ink-500">{hint}</span> : null}
    </div>
  );
}

function Card({
  title,
  action,
  flush,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-ink-200 bg-white">
      <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-3">
        <h2 className="font-heading text-base font-semibold text-ink-900">{title}</h2>
        {action}
      </div>
      <div className={flush ? undefined : "px-5 pb-5"}>{children}</div>
    </section>
  );
}

function ActionList({
  loading,
  orders,
  lowStock,
}: {
  loading: boolean;
  orders: { code: string; total: number; paymentMethod: "tunai" | "transfer" }[];
  lowStock: { id: string; name: string; available: number }[];
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (orders.length === 0 && lowStock.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-500">Tidak ada yang perlu ditindaklanjuti.</p>;
  }
  return (
    <ul className="flex flex-col divide-y divide-ink-100">
      {orders.map((o) => (
        <ActionRow
          key={o.code}
          icon={<FileCheckIcon className="size-4" />}
          iconClass="bg-info-soft text-info"
          title={o.code}
          subtitle={`Bukti ${o.paymentMethod} ${formatRupiah(o.total)}`}
          href={`/admin/pesanan/${o.code}`}
        />
      ))}
      {lowStock.slice(0, Math.max(1, 5 - orders.length)).map((p) => (
        <ActionRow
          key={p.id}
          icon={p.available <= 0 ? <TriangleAlertIcon className="size-4" /> : <PackageIcon className="size-4" />}
          iconClass={p.available <= 0 ? "bg-error-soft text-error" : "bg-warning-soft text-warning"}
          title={p.name}
          subtitle={p.available <= 0 ? "Stok habis" : `Stok tersisa ${p.available}`}
          href="/admin/stok"
        />
      ))}
    </ul>
  );
}

function ActionRow({
  icon,
  iconClass,
  title,
  subtitle,
  href,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", iconClass)}>{icon}</span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-ink-900">{title}</span>
        <span className="truncate text-xs text-ink-500">{subtitle}</span>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link href={href}>Periksa</Link>
      </Button>
    </li>
  );
}
