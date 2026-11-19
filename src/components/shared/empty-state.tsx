import type { LucideIcon } from "lucide-react";
import { InboxIcon } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
    <Empty className={cn("border border-ink-200 bg-white py-12", className)}>
      <EmptyHeader>
        <EmptyMedia className="size-14 rounded-full bg-ink-100 text-ink-500">
          <Icon className="size-6" />
        </EmptyMedia>
        <EmptyTitle className="text-base font-semibold text-ink-900">{title}</EmptyTitle>
        {description ? (
          <EmptyDescription className="text-ink-500">{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
