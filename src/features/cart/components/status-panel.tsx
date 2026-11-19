import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatusPanel({
  icon: Icon,
  title,
  description,
  tone = "neutral",
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "neutral" | "error";
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center",
        className
      )}
    >
      <div
        className={cn(
          "mb-1 flex size-14 items-center justify-center rounded-full",
          tone === "error" ? "bg-error-soft text-error" : "bg-brand-50 text-brand-600"
        )}
      >
        <Icon className="size-6" />
      </div>
      <h2 className="font-heading text-xl font-semibold text-ink-900">{title}</h2>
      <p className="max-w-sm text-sm text-ink-600">{description}</p>
      {children ? <div className="mt-2 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </div>
  );
}
