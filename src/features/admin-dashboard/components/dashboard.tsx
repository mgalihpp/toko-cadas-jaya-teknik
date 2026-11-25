"use client";

import { useQuery } from "@tanstack/react-query";
import { ClockIcon, PackageIcon, ReceiptTextIcon, TriangleAlertIcon, UploadIcon, WalletIcon } from "lucide-react";
import { io } from "next/cache";
import Link from "next/link";
import { use, useState, type ReactNode } from "react";
import { AdminBellButton, AdminHeader } from "@/components/layout";
import { ErrorState, OrderStatusBadge } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductThumb } from "@/features/cart";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

const DAY = 86_400_000;
const CHART_DAYS = 7;
const jakartaDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const weekday = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "short" });
const clock = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function compactRupiah(value: number) {
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  if (value >= 1_000) return `Rp${Math.round(value / 1_000)} rb`;
  return `Rp${value}`;
}

function ago(date: Date) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam`;
  return `${Math.floor(hours / 24)} hari`;
}

function Kpi({
  icon,
  tone,
  label,
  value,
  note,
  noteTone,
}: {
  icon: ReactNode;
  tone: string;
  label: string;
  value: ReactNode;
  note: string;
  noteTone: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-ink-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <span className={cn("flex size-[34px] items-center justify-center rounded-[10px]", tone)}>{icon}</span>
        <p className="text-xs font-medium text-ink-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-ink-900">{value}</p>
      <p className={cn("text-xs font-medium", noteTone)}>{note}</p>
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mx-3 mb-3 flex flex-col gap-2 rounded-xl border border-ink-200 bg-white p-3.5">
      <div className="flex items-center gap-2">
        <h2 className="flex-1 text-[15px] font-bold text-ink-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function AdminDashboard() {
  use(io());
  const trpc = useTRPC();
  const [range] = useState(() => {
    const hour = 3_600_000;
    const to = new Date(Math.ceil(Date.now() / hour) * hour);
    return { from: new Date(to.getTime() - 30 * DAY), to };
  });

  const dashboard = useQuery(trpc.admin.finance.dashboard.queryOptions());
  const sales = useQuery(trpc.admin.finance.sales.queryOptions({ ...range, groupBy: "day" }));
  const confirmations = useQuery(
    trpc.admin.orders.list.queryOptions({ status: "menunggu_konfirmasi", pageSize: 5 }),
  );
  const ready = useQuery(trpc.admin.orders.list.queryOptions({ status: "dibayar", pageSize: 3 }));

  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(now);

  const chart = (() => {
    const totals = new Map(sales.data?.rows.map((r) => [r.period, r.total]));
    const points = Array.from({ length: CHART_DAYS }, (_, i) => {
      const date = new Date(range.to.getTime() - (CHART_DAYS - 1 - i) * DAY - 1);
      return { label: weekday.format(date).replace(".", ""), total: totals.get(jakartaDay.format(date)) ?? 0 };
    });
    const max = Math.max(1, ...points.map((p) => p.total));
    return { points, max, sum: points.reduce((s, p) => s + p.total, 0) };
  })();

  const d = dashboard.data;
  const delta = d ? d.newToday - d.newYesterday : 0;
  const header = (
    <AdminHeader title="Dasbor" subtitle={<span suppressHydrationWarning>{dateLabel}</span>} right={<AdminBellButton />} />
  );

  if (dashboard.isError) {
    return (
      <div className="flex flex-1 flex-col">
        {header}
        <ErrorState description={dashboard.error.message} onRetry={() => dashboard.refetch()} />
      </div>
    );
  }

  if (!d) return <DashboardSkeleton header={header} />;

  const actionRows = [
    ...(confirmations.data?.items ?? []).map((o) => ({
      key: o.code,
      code: o.code,
      total: o.total,
      text: "Bukti transfer baru diunggah",
      at: o.createdAt,
      icon: <UploadIcon className="size-5 text-warning" strokeWidth={2} />,
      tone: "bg-warning-soft",
    })),
    ...(ready.data?.items ?? []).map((o) => ({
      key: o.code,
      code: o.code,
      total: o.total,
      text: "Siap diproses",
      at: o.createdAt,
      icon: <PackageIcon className="size-5 text-brand-600" strokeWidth={2} />,
      tone: "bg-brand-100",
    })),
  ];

  return (
    <div className="flex flex-1 flex-col pb-3">
      {header}
      <div className="grid grid-cols-2 gap-2.5 p-3">
        <Kpi
          icon={<ReceiptTextIcon className="size-5 text-brand-600" strokeWidth={2} />}
          tone="bg-brand-100"
          label="Pesanan baru"
          value={d.newToday}
          note={delta === 0 ? "Sama seperti kemarin" : `${delta > 0 ? "+" : ""}${delta} dari kemarin`}
          noteTone="text-brand-600"
        />
        <Kpi
          icon={<ClockIcon className="size-5 text-warning" strokeWidth={2} />}
          tone="bg-warning-soft"
          label="Menunggu konfirmasi"
          value={d.awaitingConfirmation}
          note="Cek bukti transfer"
          noteTone="text-warning"
        />
        <Kpi
          icon={<TriangleAlertIcon className="size-5 text-error" strokeWidth={2} />}
          tone="bg-error-soft"
          label="Stok menipis"
          value={d.lowStock.length}
          note="Sisa 2 unit atau kurang"
          noteTone="text-error"
        />
        <Kpi
          icon={<WalletIcon className="size-5 text-success" strokeWidth={2} />}
          tone="bg-success-soft"
          label="Penjualan hari ini"
          value={compactRupiah(d.salesToday.total).replace(".", ",")}
          note={`${d.salesToday.transactions} transaksi`}
          noteTone="text-success"
        />
      </div>

      <Card
        title="Penjualan 7 hari"
        action={
          <span className="rounded-md bg-success-soft px-2 py-[3px] text-[11px] font-bold text-success">
            {compactRupiah(chart.sum)}
          </span>
        }
      >
        <div className="flex items-end gap-2 pt-2">
          {chart.points.map((p, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-[120px] w-full items-end" title={formatRupiah(p.total)}>
                <div
                  className={cn("w-full rounded-t-md", i === chart.points.length - 1 ? "bg-brand-600" : "bg-brand-200")}
                  style={{ height: `${Math.max(2, (p.total / chart.max) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] font-medium text-ink-500">{p.label}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="Perlu tindakan"
        action={
          <Link href="/admin/pesanan" className="text-[13px] font-bold text-brand-600">
            Semua
          </Link>
        }
      >
        {actionRows.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-500">Tidak ada yang perlu ditindaklanjuti.</p>
        ) : (
          <ul>
            {actionRows.map((row) => (
              <li key={`${row.key}-${row.text}`} className="border-b border-ink-200 last:border-b-0">
                <Link href={`/admin/pesanan/${row.code}`} className="flex items-center gap-2.5 py-3">
                  <span className={cn("flex size-[42px] shrink-0 items-center justify-center rounded-xl", row.tone)}>
                    {row.icon}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="truncate text-sm font-bold text-ink-900">
                      {row.code} · {formatRupiah(row.total)}
                    </p>
                    <p className="text-xs text-ink-500">{row.text}</p>
                  </div>
                  <span className="text-xs text-ink-500">{ago(row.at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="Stok menipis"
        action={
          <Link href="/admin/stok" className="text-[13px] font-bold text-brand-600">
            Kelola stok
          </Link>
        }
      >
        {d.lowStock.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-500">Semua stok aman.</p>
        ) : (
          <ul>
            {d.lowStock.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center gap-2.5 py-1.5">
                <ProductThumb src={p.image} alt="" className="size-11" />
                <p className="line-clamp-2 flex-1 text-[13px] font-medium text-ink-900">{p.name}</p>
                <span className="rounded-md bg-error-soft px-2 py-[3px] text-[11px] font-bold whitespace-nowrap text-error">
                  {p.available <= 0 ? "Habis" : `Sisa ${p.available}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Penjualan terbaru">
        {d.latestSales.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-500">Belum ada penjualan.</p>
        ) : (
          <ul>
            {d.latestSales.map((o) => (
              <li key={o.code} className="flex items-center gap-2 border-b border-ink-200 py-2.5 last:border-b-0">
                <div className="flex min-w-0 flex-1 flex-col gap-px">
                  <p className="truncate text-sm font-medium text-ink-900">
                    {o.code} · {o.recipientName}
                  </p>
                  <p className="text-xs text-ink-500">
                    {o.paymentMethod === "transfer" ? "Transfer" : "Tunai"} · {clock.format(new Date(o.createdAt)).replace(":", ".")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-[3px]">
                  <p className="text-sm font-bold text-ink-900">{formatRupiah(o.total)}</p>
                  <OrderStatusBadge status={o.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function DashboardSkeleton({ header }: { header: ReactNode }) {
  return (
    <div role="status" className="flex flex-1 flex-col">
      {header}
      <div className="grid grid-cols-2 gap-2.5 p-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[104px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="mx-3 mb-3 h-[190px] rounded-xl" />
      <Skeleton className="mx-3 mb-3 h-[210px] rounded-xl" />
    </div>
  );
}
