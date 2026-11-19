import { cn } from "@/lib/utils";
import { PAYMENT_STATUS_LABEL } from "../labels";
import type { PaymentStatus } from "../types";

const STATUS_CLASS: Record<PaymentStatus, string> = {
  menunggu: "border-info-border bg-info-soft text-info",
  diterima: "border-success-border bg-success-soft text-success",
  ditolak: "border-error-border bg-error-soft text-error",
};

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus;
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
      {PAYMENT_STATUS_LABEL[status]}
    </span>
  );
}
