"use client";

import { useQuery } from "@tanstack/react-query";
import { HistoryIcon } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/shared";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

type Reason = "penyesuaian" | "kunci" | "lepas" | "terjual";

function describe(reason: Reason, change: number) {
  const n = Math.abs(change);
  switch (reason) {
    case "kunci":
      return `Dikunci ${n}`;
    case "lepas":
      return `Dilepas ${n}`;
    case "terjual":
      return `Terjual ${n}`;
    default:
      return change >= 0 ? `Ditambah ${n}` : `Dikurangi ${n}`;
  }
}

export function StockHistorySheet({
  product,
  onOpenChange,
}: {
  product: { id: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={product !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b border-ink-200">
          <SheetTitle>Riwayat stok</SheetTitle>
          <SheetDescription className="truncate">{product?.name}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          {product ? <HistoryList productId={product.id} /> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function HistoryList({ productId }: { productId: string }) {
  const trpc = useTRPC();
  const logs = useQuery(trpc.admin.stock.logs.queryOptions({ productId, limit: 100 }));

  if (logs.isError) {
    return <ErrorState description={logs.error.message} onRetry={() => logs.refetch()} />;
  }
  if (!logs.data) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }
  if (logs.data.length === 0) {
    return (
      <EmptyState
        icon={HistoryIcon}
        title="Belum ada perubahan stok"
        description="Penyesuaian dan pergerakan stok dari pesanan akan tercatat di sini."
      />
    );
  }

  return (
    <ol className="flex flex-col">
      {logs.data.map((log) => {
        const positive = log.reason === "lepas" || (log.reason === "penyesuaian" && log.change > 0);
        return (
          <li key={log.id} className="flex gap-3 border-b border-ink-100 py-3 last:border-0">
            <span
              className={cn(
                "mt-1.5 size-2 shrink-0 rounded-full",
                positive ? "bg-success" : log.reason === "kunci" ? "bg-warning" : "bg-brand-500"
              )}
              aria-hidden
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-semibold text-ink-900">
                {describe(log.reason, log.change)}
              </span>
              {log.note ? <span className="text-sm text-ink-600">{log.note}</span> : null}
              {log.orderId && !log.note ? (
                <span className="text-sm text-ink-600">Dari pesanan</span>
              ) : null}
              <span className="text-xs text-ink-500">
                {formatDateTime(log.createdAt)} oleh {log.actorName ?? "sistem"}
              </span>
            </div>
          </li>
        );
      })}
      <li className="pt-3 text-xs text-ink-500">
        Menampilkan {logs.data.length} perubahan terakhir.
      </li>
    </ol>
  );
}
