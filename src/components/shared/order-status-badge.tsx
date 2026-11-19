import type { ORDER_STATUSES } from "@/server/db/schema/shared";
import { cn } from "@/lib/utils";

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  menunggu_pembayaran: "Menunggu pembayaran",
  menunggu_konfirmasi: "Menunggu konfirmasi",
  dibayar: "Dibayar",
  diproses: "Diproses",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  menunggu_pembayaran: "border-warning-border bg-warning-soft text-warning",
  menunggu_konfirmasi: "border-info-border bg-info-soft text-info",
  dibayar: "border-success-border bg-success-soft text-success",
  diproses: "border-info-border bg-info-soft text-info",
  selesai: "border-ink-200 bg-ink-100 text-ink-600",
  dibatalkan: "border-error-border bg-error-soft text-error",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold whitespace-nowrap",
        STATUS_CLASS[status],
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
