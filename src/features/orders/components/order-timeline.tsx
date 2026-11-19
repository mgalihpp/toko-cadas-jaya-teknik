import { Check, X } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL } from "@/components/shared";
import type { OrderDetail, OrderStatus } from "../types";

type Step = {
  key: string;
  label: string;
  at?: Date;
  state: "done" | "current" | "upcoming" | "cancelled";
};

const FLOW: OrderStatus[] = [
  "menunggu_pembayaran",
  "menunggu_konfirmasi",
  "dibayar",
  "diproses",
  "selesai",
];

function lastLogAt(order: OrderDetail, status: OrderStatus) {
  const logs = order.statusLogs.filter((l) => l.toStatus === status);
  return logs.at(-1)?.createdAt;
}

function buildSteps(order: OrderDetail): Step[] {
  const flow = FLOW.filter(
    (s) => order.paymentMethod === "transfer" || s !== "menunggu_konfirmasi"
  );
  const created: Step = {
    key: "dibuat",
    label: "Pesanan dibuat",
    at: order.createdAt,
    state: "done",
  };

  if (order.status === "dibatalkan") {
    const reached = flow.filter((s) => lastLogAt(order, s));
    return [
      created,
      ...reached.map<Step>((s) => ({
        key: s,
        label: ORDER_STATUS_LABEL[s],
        at: lastLogAt(order, s),
        state: "done",
      })),
      {
        key: "dibatalkan",
        label: "Dibatalkan",
        at: lastLogAt(order, "dibatalkan"),
        state: "cancelled",
      },
    ];
  }

  const currentIndex = flow.indexOf(order.status);
  return [
    created,
    ...flow.map<Step>((s, i) => ({
      key: s,
      label: ORDER_STATUS_LABEL[s],
      at: i <= currentIndex ? lastLogAt(order, s) : undefined,
      state:
        i < currentIndex || order.status === "selesai"
          ? "done"
          : i === currentIndex
            ? "current"
            : "upcoming",
    })),
  ];
}

export function OrderTimeline({ order }: { order: OrderDetail }) {
  const steps = buildSteps(order);
  const cancelNote =
    order.status === "dibatalkan"
      ? order.statusLogs.findLast((l) => l.toStatus === "dibatalkan")?.note
      : null;

  return (
    <section aria-labelledby="timeline-heading">
      <h2
        id="timeline-heading"
        className="font-sans text-[13px] font-semibold text-ink-500"
      >
        Status
      </h2>
      <ol className="mt-4">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                    step.state === "done" && "border-success bg-success text-white",
                    step.state === "current" && "border-warning bg-warning-soft",
                    step.state === "upcoming" && "border-ink-300 bg-white",
                    step.state === "cancelled" && "border-error bg-error text-white"
                  )}
                >
                  {step.state === "done" && <Check className="size-3.5" strokeWidth={3} />}
                  {step.state === "current" && (
                    <span className="size-2 rounded-full bg-warning" />
                  )}
                  {step.state === "cancelled" && <X className="size-3.5" strokeWidth={3} />}
                </span>
                {!isLast && (
                  <span
                    className={cn(
                      "my-1 w-0.5 flex-1",
                      step.state === "done" ? "bg-success" : "bg-ink-200"
                    )}
                  />
                )}
              </div>
              <div className={cn("min-w-0", isLast ? "pb-0" : "pb-6")}>
                <p
                  className={cn(
                    "text-sm",
                    step.state === "upcoming"
                      ? "font-medium text-ink-500"
                      : "font-semibold text-ink-900"
                  )}
                >
                  {step.label}
                </p>
                {step.state === "current" ? (
                  <p className="text-xs text-warning">Sekarang</p>
                ) : step.at ? (
                  <p className="text-xs text-ink-500">{formatDateTime(step.at)}</p>
                ) : null}
                {step.state === "cancelled" && cancelNote && (
                  <p className="mt-1 text-xs text-ink-600">{cancelNote}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
