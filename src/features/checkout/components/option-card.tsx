"use client";

import type { LucideIcon } from "lucide-react";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export function OptionCard({
  value,
  title,
  description,
  icon: Icon,
  checked,
}: {
  value: string;
  title: string;
  description: string;
  icon: LucideIcon;
  checked: boolean;
}) {
  const id = `opt-${value}`;
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-3.5 rounded-xl border p-4 transition-colors sm:p-[18px]",
        checked
          ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
          : "border-border bg-background hover:bg-ink-50"
      )}
    >
      <RadioGroupItem id={id} value={value} className="size-5" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[15px] font-semibold text-ink-900">{title}</span>
        <span className="text-[13px] text-ink-600">{description}</span>
      </span>
      <Icon className={cn("size-[22px] shrink-0", checked ? "text-brand-600" : "text-ink-500")} />
    </label>
  );
}
