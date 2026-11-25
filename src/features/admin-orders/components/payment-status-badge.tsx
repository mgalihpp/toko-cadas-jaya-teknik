import { cn } from "@/lib/utils";
import { PAYMENT_STATUS_LABEL } from "../labels";
import type { PaymentStatus } from "../types";

const STATUS_CLASS: Record<PaymentStatus, string> = {
  menunggu: "bg-info-soft text-info",
  diterima: "bg-success-soft text-success",
  ditolak: "bg-error-soft text-error",
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
        "inline-flex h-[23px] w-fit items-center gap-[5px] rounded-full px-2.5 text-xs font-semibold whitespace-nowrap",
        STATUS_CLASS[status],
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {PAYMENT_STATUS_LABEL[status]}
    </span>
  );
}
