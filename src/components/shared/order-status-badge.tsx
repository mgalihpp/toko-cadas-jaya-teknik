import { CheckIcon, ClockIcon, PackageIcon, XIcon, type LucideIcon } from "lucide-react";
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

const STATUS_STYLE: Record<OrderStatus, { className: string; icon: LucideIcon }> = {
  menunggu_pembayaran: { className: "bg-warning-soft text-warning", icon: ClockIcon },
  menunggu_konfirmasi: { className: "bg-warning-soft text-warning", icon: ClockIcon },
  dibayar: { className: "bg-success-soft text-success", icon: CheckIcon },
  diproses: { className: "bg-brand-100 text-brand-700", icon: PackageIcon },
  selesai: { className: "bg-success-soft text-success", icon: CheckIcon },
  dibatalkan: { className: "bg-error-soft text-error", icon: XIcon },
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const { className: tone, icon: Icon } = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-md px-2 py-[3px] text-[11px] leading-[1.2] font-bold whitespace-nowrap",
        tone,
        className,
      )}
    >
      <Icon className="size-3" strokeWidth={2.2} aria-hidden />
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
