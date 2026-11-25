"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, DownloadIcon, MinusIcon, PackageIcon, PlusIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AdminHeader, AdminHeaderAction } from "@/components/layout";
import { MButton } from "@/components/mobile/m-button";
import { BottomSheet, SheetClose, SheetRoot } from "@/components/mobile/sheet";
import { useSwipe } from "@/components/mobile/use-swipe";
import { EmptyState, ErrorState } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductBadge } from "@/features/catalog";
import { ProductThumb } from "@/features/cart";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { downloadCsv } from "../../admin-orders/csv";
import { LOW_STOCK } from "../schemas";

type Tab = "semua" | "menipis" | "riwayat";
const TABS: { value: Tab; label: string }[] = [
  { value: "semua", label: "Semua stok" },
  { value: "menipis", label: "Menipis" },
  { value: "riwayat", label: "Riwayat perubahan" },
];

const REASON_LABEL = { penyesuaian: "Penyesuaian", kunci: "Dikunci pesanan", lepas: "Dilepas", terjual: "Terjual" } as const;

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-ink-50 px-2.5 py-2">
      <p className="text-[11px] font-medium text-ink-500">{label}</p>
      <p className={cn("text-lg font-bold text-ink-900", tone)}>{value}</p>
    </div>
  );
}

export function StockList({ adjustId }: { adjustId?: string }) {
  const trpc = useTRPC();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("semua");
  const index = TABS.findIndex((t) => t.value === tab);
  const swipe = useSwipe<HTMLDivElement>({
    onLeft: () => TABS[index + 1] && setTab(TABS[index + 1].value),
    onRight: () => TABS[index - 1] && setTab(TABS[index - 1].value),
  });

  const stock = useQuery(
    trpc.admin.stock.list.queryOptions({ lowStockOnly: tab === "menipis", lowStockThreshold: LOW_STOCK, pageSize: 100 }),
  );
  const history = useQuery(trpc.admin.stock.recentLogs.queryOptions(undefined, { enabled: tab === "riwayat" }));

  function exportCsv() {
    const rows = stock.data?.items ?? [];
    downloadCsv(
      "stok.csv",
      ["Produk", "Kondisi", "Fisik", "Terkunci", "Tersedia"],
      rows.map((p) => [p.name, p.condition, p.stockPhysical, p.stockLocked, p.available]),
    );
  }

  const target = adjustId ? stock.data?.items.find((p) => p.id === adjustId) : undefined;

  return (
    <div className="flex flex-1 flex-col">
      <AdminHeader
        title="Stok"
        right={
          <AdminHeaderAction label="Ekspor" onClick={exportCsv}>
            <DownloadIcon className="size-6" strokeWidth={1.8} />
          </AdminHeaderAction>
        }
      />
      <div role="tablist" className="cjt-no-scrollbar flex overflow-x-auto border-b border-ink-200 bg-white">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "h-[46px] shrink-0 border-b-[3px] px-3.5 text-sm whitespace-nowrap",
              tab === t.value ? "border-brand-600 font-bold text-brand-700" : "border-transparent font-medium text-ink-500",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div ref={swipe} className="flex flex-1 flex-col">
        {tab === "riwayat" ? (
          history.isPending ? (
            <ListSkeleton />
          ) : history.isError ? (
            <ErrorState description={history.error.message} onRetry={() => history.refetch()} />
          ) : history.data.length === 0 ? (
            <EmptyState icon={PackageIcon} title="Belum ada riwayat" description="Perubahan stok akan tercatat di sini." />
          ) : (
            <ul>
              {history.data.map((log) => (
                <li key={log.id} className="flex items-center gap-3 border-b border-ink-200 bg-white p-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="truncate text-sm font-medium text-ink-900">{log.productName}</p>
                    <p className="text-xs text-ink-500">
                      {REASON_LABEL[log.reason]} · {log.actorName ?? "Sistem"} · {formatDateTime(log.createdAt)}
                    </p>
                    {log.note ? <p className="text-xs text-ink-500">{log.note}</p> : null}
                  </div>
                  <span
                    className={cn(
                      "rounded-md px-2 py-[3px] text-xs font-bold",
                      log.change >= 0 ? "bg-success-soft text-success" : "bg-error-soft text-error",
                    )}
                  >
                    {log.change > 0 ? `+${log.change}` : log.change}
                  </span>
                </li>
              ))}
            </ul>
          )
        ) : stock.isPending ? (
          <ListSkeleton />
        ) : stock.isError ? (
          <ErrorState description={stock.error.message} onRetry={() => stock.refetch()} />
        ) : stock.data.items.length === 0 ? (
          <EmptyState
            icon={PackageIcon}
            title={tab === "menipis" ? "Tidak ada stok menipis" : "Belum ada produk"}
            description={tab === "menipis" ? "Semua produk stoknya aman." : "Tambahkan produk dulu."}
          />
        ) : (
          <ul>
            {stock.data.items.map((p) => (
              <li key={p.id} className="flex flex-col gap-2.5 border-b border-ink-200 bg-white p-3">
                <div className="flex items-center gap-2.5">
                  <ProductThumb src={p.thumbnailUrl} alt="" className="size-12" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="line-clamp-2 text-sm font-medium text-ink-900">{p.name}</p>
                    <div>
                      <ProductBadge kind={p.condition} />
                    </div>
                  </div>
                  <Link
                    href={`/admin/stok/${p.id}`}
                    className="rounded-lg border-[1.5px] border-brand-600 px-3 py-[7px] text-[13px] font-bold text-brand-700"
                  >
                    Atur
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Fisik" value={p.stockPhysical} />
                  <Stat label="Terkunci" value={p.stockLocked} tone="text-warning" />
                  <Stat label="Tersedia" value={p.available} tone={p.available <= 0 ? "text-error" : "text-success"} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <SheetRoot open={Boolean(adjustId)} onOpenChange={(open) => !open && router.push("/admin/stok")}>
        <BottomSheet title="Atur stok">
          {target ? <AdjustForm key={target.id} product={target} onDone={() => router.push("/admin/stok")} /> : <ListSkeleton />}
        </BottomSheet>
      </SheetRoot>
    </div>
  );
}

function AdjustForm({
  product,
  onDone,
}: {
  product: { id: string; name: string; thumbnailUrl: string | null; stockPhysical: number; stockLocked: number; available: number };
  onDone: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [value, setValue] = useState(product.stockPhysical);
  const [reason, setReason] = useState("");
  const adjust = useMutation(
    trpc.admin.stock.adjust.mutationOptions({
      onSuccess: async () => {
        toast.success("Stok diperbarui");
        await Promise.all([
          queryClient.invalidateQueries(trpc.admin.stock.pathFilter()),
          queryClient.invalidateQueries(trpc.admin.products.pathFilter()),
          queryClient.invalidateQueries(trpc.admin.finance.dashboard.pathFilter()),
          queryClient.invalidateQueries(trpc.catalog.pathFilter()),
        ]);
        onDone();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const tooLow = value < product.stockLocked;
  const unchanged = value === product.stockPhysical;
  const reasonValid = reason.trim().length >= 3;
  const canSave = !tooLow && !unchanged && reasonValid;
  const btn = "flex size-[34px] items-center justify-center text-brand-700 disabled:text-ink-300";

  return (
    <>
      <div className="flex h-12 items-center gap-1 pr-2 pl-4">
        <p className="flex-1 text-[17px] font-bold text-ink-900">Atur stok</p>
        <SheetClose aria-label="Tutup" className="flex size-10 items-center justify-center rounded-full text-ink-500">
          <XIcon className="size-6" strokeWidth={1.8} />
        </SheetClose>
      </div>
      <div className="flex flex-col gap-3 px-4 py-1">
        <div className="flex items-center gap-3">
          <ProductThumb src={product.thumbnailUrl} alt="" className="size-14" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="line-clamp-2 text-sm font-bold text-ink-900">{product.name}</p>
            <p className="text-xs text-ink-500">
              Fisik {product.stockPhysical} · Terkunci {product.stockLocked} · Tersedia {product.available}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="flex-1 text-sm font-bold text-ink-900">Stok fisik baru</p>
          <div className="flex h-9 items-center overflow-hidden rounded-lg border-[1.5px] border-ink-200">
            <button type="button" aria-label="Kurangi" className={btn} disabled={value <= 0} onClick={() => setValue((v) => v - 1)}>
              <MinusIcon className="size-[18px]" strokeWidth={2} />
            </button>
            <span className="w-10 text-center text-[15px] font-bold text-ink-900" aria-live="polite">
              {value}
            </span>
            <button type="button" aria-label="Tambah" className={btn} onClick={() => setValue((v) => v + 1)}>
              <PlusIcon className="size-[18px]" strokeWidth={2} />
            </button>
          </div>
        </div>
        {tooLow ? (
          <p className="text-xs font-medium text-error">Stok fisik tidak boleh di bawah stok terkunci ({product.stockLocked})</p>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="stock-reason" className="text-[13px] font-medium text-ink-900">
            Alasan perubahan
          </label>
          <input
            id="stock-reason"
            value={reason}
            maxLength={120}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Contoh: Barang masuk dari supplier"
            className="h-12 w-full rounded-[10px] border-2 border-brand-600 bg-white px-3 text-[15px] text-ink-900 outline-none placeholder:text-ink-500"
          />
        </div>
        <p className="text-xs text-ink-500">Perubahan dicatat atas nama akunmu beserta waktunya.</p>
      </div>
      <div className="flex gap-2.5 border-t border-ink-200 px-4 pt-2.5 pb-[18px]">
        <MButton variant="outline" size="lg" className="w-[110px]" onClick={onDone}>
          Batal
        </MButton>
        <MButton
          size="lg"
          block
          disabled={!canSave}
          loading={adjust.isPending}
          onClick={() => adjust.mutate({ productId: product.id, newPhysical: value, note: reason.trim() })}
        >
          <CheckIcon className="size-[18px]" />
          Simpan stok
        </MButton>
      </div>
    </>
  );
}

function ListSkeleton() {
  return (
    <div role="status" className="flex flex-col">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-2.5 border-b border-ink-200 bg-white p-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-12 rounded-lg" />
            <Skeleton className="h-3.5 w-3/5" />
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
}
