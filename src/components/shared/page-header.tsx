import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-3 px-3 pt-3", className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h1 className="text-[17px] leading-[1.35] font-bold text-ink-900">{title}</h1>
        {description ? <p className="text-xs text-ink-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
