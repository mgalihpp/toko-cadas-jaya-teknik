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
    <div className={cn("flex flex-col items-center gap-2.5 px-6 py-14 text-center", className)}>
      <span
        className={cn(
          "flex size-24 items-center justify-center rounded-full",
          tone === "error" ? "bg-error-soft text-error" : "bg-brand-100 text-brand-600",
        )}
      >
        <Icon className="size-11" strokeWidth={1.6} />
      </span>
      <h2 className="text-lg font-bold text-ink-900">{title}</h2>
      <p className="max-w-[290px] text-sm text-ink-500">{description}</p>
      {children ? <div className="mt-1.5 flex flex-col items-center gap-2.5">{children}</div> : null}
    </div>
  );
}
