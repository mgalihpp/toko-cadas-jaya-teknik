"use client";

import { useQuery } from "@tanstack/react-query";
import { endOfDay, startOfDay } from "date-fns";
import { BanknoteIcon, LandmarkIcon, SlidersHorizontalIcon, WalletIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AdminHeader, AdminHeaderAction } from "@/components/layout";
import { MButton } from "@/components/mobile/m-button";
import { BottomSheet, SheetClose, SheetRoot } from "@/components/mobile/sheet";
import { EmptyState, ErrorState } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { PAYMENT_STATUS_LABEL } from "../../admin-orders/labels";
import type { PaymentStatus } from "../../admin-orders/types";

type Chip = "semua" | "transfer" | "tunai" | "diterima" | "ditolak";
const CHIPS: { value: Chip; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "transfer", label: "Transfer" },
  { value: "tunai", label: "Tunai" },
  { value: "diterima", label: "Diterima" },
  { value: "ditolak", label: "Ditolak" },
];

const STATUS_TONE: Record<PaymentStatus, string> = {
  menunggu: "bg-warning-soft text-warning",
  diterima: "bg-success-soft text-success",
  ditolak: "bg-error-soft text-error",
};

const stamp = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function compactRupiah(value: number) {
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  if (value >= 1_000) return `Rp${Math.round(value / 1_000)} rb`;
  return `Rp${value}`;
}

export function TransactionList() {
  const trpc = useTRPC();
  const [chip, setChip] = useState<Chip>("semua");
  const [filterOpen, setFilterOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filters = {
    method: chip === "transfer" || chip === "tunai" ? chip : undefined,
    status: chip === "diterima" || chip === "ditolak" ? chip : undefined,
    from: from ? startOfDay(new Date(from)) : undefined,
    to: to ? endOfDay(new Date(to)) : undefined,
  } as const;
  const list = useQuery(trpc.admin.finance.transactions.queryOptions({ ...filters, pageSize: 100 }));
  const received = (list.data?.items ?? []).filter((t) => t.status === "diterima").reduce((s, t) => s + t.amount, 0);
  const dateActive = Boolean(from || to);

  return (
    <div className="flex flex-1 flex-col">
      <AdminHeader
        title="Transaksi"
        right={
          <AdminHeaderAction label="Filter" onClick={() => setFilterOpen(true)}>
            <SlidersHorizontalIcon className="size-6" strokeWidth={1.8} />
            {dateActive ? <span className="absolute top-2 right-2 size-2.5 rounded-full bg-accent-yellow" /> : null}
          </AdminHeaderAction>
        }
      />
      <div className="grid grid-cols-2 gap-2.5 bg-white p-3">
        <div className="flex flex-col gap-0.5 rounded-[10px] bg-success-soft px-3 py-2.5">
          <p className="text-xs text-ink-500">Total diterima</p>
          <p className="text-xl font-bold text-success">{compactRupiah(received).replace(".", ",")}</p>
        </div>
        <div className="flex flex-col gap-0.5 rounded-[10px] bg-brand-100 px-3 py-2.5">
          <p className="text-xs text-ink-500">Transaksi</p>
          <p className="text-xl font-bold text-brand-700">{list.data?.total ?? 0}</p>
        </div>
      </div>
      <div className="cjt-no-scrollbar flex gap-2 overflow-x-auto border-b border-ink-200 bg-white px-3 pb-2.5">
        {CHIPS.map((c) => (
          <button
            key={c.value}
            type="button"
            aria-pressed={chip === c.value}
            onClick={() => setChip(c.value)}
            className={cn(
              "inline-flex h-[34px] shrink-0 items-center rounded-[17px] border-[1.5px] px-3.5 text-[13px] font-bold",
              chip === c.value ? "border-brand-600 bg-brand-600 text-white" : "border-ink-200 bg-white text-ink-900",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {list.isPending ? (
        <div role="status" className="flex flex-col">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2.5 border-b border-ink-200 bg-white p-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : list.isError ? (
        <ErrorState description={list.error.message} onRetry={() => list.refetch()} />
      ) : list.data.items.length === 0 ? (
        <EmptyState icon={WalletIcon} title="Belum ada transaksi" description="Pembayaran yang masuk akan tercatat di sini." />
      ) : (
        <ul>
          {list.data.items.map((t) => (
            <li key={t.id} className="border-b border-ink-200 bg-white">
              <Link href={`/admin/pesanan/${t.orderCode}`} className="flex items-center gap-2.5 p-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100">
                  {t.method === "transfer" ? (
                    <LandmarkIcon className="size-5 text-brand-600" strokeWidth={1.8} />
                  ) : (
                    <BanknoteIcon className="size-5 text-brand-600" strokeWidth={1.8} />
                  )}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-sm font-bold text-ink-900">{t.orderCode}</p>
                  <p className="text-xs text-ink-500">
                    {t.method === "transfer" ? "Transfer" : "Tunai"} · {stamp.format(new Date(t.createdAt)).replace(":", ".")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-[3px]">
                  <p className="text-sm font-bold text-ink-900">{formatRupiah(t.amount)}</p>
                  <span
                    className={cn(
                      "inline-flex rounded-md px-2 py-[3px] text-[11px] leading-[1.2] font-bold",
                      STATUS_TONE[t.status],
                    )}
                  >
                    {PAYMENT_STATUS_LABEL[t.status]}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <SheetRoot open={filterOpen} onOpenChange={setFilterOpen}>
        <BottomSheet title="Filter transaksi">
          <div className="flex h-12 items-center gap-1 pr-2 pl-4">
            <p className="flex-1 text-[17px] font-bold text-ink-900">Filter tanggal</p>
            <SheetClose aria-label="Tutup" className="flex size-10 items-center justify-center rounded-full text-ink-500">
              <XIcon className="size-6" strokeWidth={1.8} />
            </SheetClose>
          </div>
          <div className="grid grid-cols-2 gap-2.5 px-4 py-1">
            {(
              [
                ["Dari tanggal", from, setFrom],
                ["Sampai tanggal", to, setTo],
              ] as const
            ).map(([label, value, set]) => (
              <label key={label} className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-900">
                {label}
                <input
                  type="date"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="h-12 rounded-[10px] border-[1.5px] border-ink-200 px-3 text-sm font-normal"
                />
              </label>
            ))}
          </div>
          <div className="flex gap-2.5 border-t border-ink-200 px-4 pt-2.5 pb-[18px]">
            <MButton
              variant="outline"
              size="lg"
              className="w-[110px]"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
            >
              Reset
            </MButton>
            <MButton size="lg" block onClick={() => setFilterOpen(false)}>
              Terapkan
            </MButton>
          </div>
        </BottomSheet>
      </SheetRoot>
    </div>
  );
}
