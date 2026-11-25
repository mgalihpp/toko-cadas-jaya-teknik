"use client";

import { useQuery } from "@tanstack/react-query";
import { HistoryIcon, LockIcon, LockOpenIcon, MinusIcon, PlusIcon, type LucideIcon } from "lucide-react";
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

function describe(reason: Reason, change: number): { label: string; icon: LucideIcon; tone: string } {
  const n = Math.abs(change);
  switch (reason) {
    case "kunci":
      return { label: `Dikunci ${n}`, icon: LockIcon, tone: "text-info" };
    case "lepas":
      return { label: `Dilepas ${n}`, icon: LockOpenIcon, tone: "text-ink-600" };
    case "terjual":
      return { label: `Terjual ${n}`, icon: MinusIcon, tone: "text-error" };
    default:
      return change >= 0
        ? { label: `Ditambah ${n}`, icon: PlusIcon, tone: "text-success" }
        : { label: `Dikurangi ${n}`, icon: MinusIcon, tone: "text-error" };
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
          <SheetTitle className="font-heading text-lg font-semibold text-ink-900">Riwayat stok</SheetTitle>
          <SheetDescription className="truncate text-[13px] text-ink-500">{product?.name}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
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
      <div className="flex flex-col gap-3 pt-4">
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
        const { label, icon: Icon, tone } = describe(log.reason, log.change);
        const detail = log.note ?? (log.orderId ? "Dari pesanan" : null);
        return (
          <li key={log.id} className="flex items-start gap-3.5 border-b border-ink-200 py-2.5">
            <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-ink-100">
              <Icon className={cn("size-3.5", tone)} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1.5">
              <span className={cn("text-sm leading-[17px] font-semibold", tone)}>{label}</span>
              {detail ? <span className="text-sm text-ink-600">{detail}</span> : null}
              <span className="text-xs leading-[15px] text-ink-500">
                {formatDateTime(log.createdAt)} oleh {log.actorName ?? "sistem"}
              </span>
            </div>
          </li>
        );
      })}
      <li className="pt-3 text-xs text-ink-500">Menampilkan {logs.data.length} perubahan terakhir.</li>
    </ol>
  );
}
