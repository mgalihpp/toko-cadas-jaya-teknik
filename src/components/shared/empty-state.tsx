import type { LucideIcon } from "lucide-react";
import { InboxIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon = InboxIcon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2.5 px-6 py-14 text-center", className)}>
      <span className="flex size-24 items-center justify-center rounded-full bg-brand-100">
        <Icon className="size-11 text-brand-600" strokeWidth={1.6} />
      </span>
      <h2 className="text-lg leading-[1.35] font-bold text-ink-900">{title}</h2>
      {description ? (
        <p className="max-w-[290px] text-balance text-sm leading-[1.35] text-ink-500">{description}</p>
      ) : null}
      {action ? <div className="mt-1.5 flex flex-col items-center gap-2.5">{action}</div> : null}
    </div>
  );
}
