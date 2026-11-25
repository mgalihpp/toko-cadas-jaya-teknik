import { cn } from "@/lib/utils";

export function CountBadge({
  count,
  className,
  ringClass = "border-brand-700",
}: {
  count: number;
  className?: string;
  ringClass?: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 bg-accent-yellow px-1 text-[11px] leading-none font-bold text-ink-900",
        ringClass,
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
