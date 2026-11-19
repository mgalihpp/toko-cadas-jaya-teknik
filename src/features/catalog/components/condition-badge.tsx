import { cn } from "@/lib/utils";
import type { Condition } from "../types";

const STYLES: Record<Condition, { label: string; className: string }> = {
  baru: { label: "Baru", className: "bg-ink-900 text-white" },
  bekas: { label: "Bekas", className: "bg-accent-yellow text-ink-900" },
};

export function ConditionBadge({
  condition,
  className,
}: {
  condition: Condition;
  className?: string;
}) {
  const style = STYLES[condition];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs leading-none font-semibold",
        style.className,
        className
      )}
    >
      {style.label}
    </span>
  );
}
