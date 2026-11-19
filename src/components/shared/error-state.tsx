"use client";

import { RotateCwIcon, TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Gagal memuat data",
  description = "Periksa koneksi internet lalu coba lagi.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <Empty className={cn("border border-error-border bg-error-soft py-12", className)}>
      <EmptyHeader>
        <EmptyMedia className="size-14 rounded-full bg-white text-error">
          <TriangleAlertIcon className="size-6" />
        </EmptyMedia>
        <EmptyTitle className="text-base font-semibold text-ink-900">{title}</EmptyTitle>
        <EmptyDescription className="text-ink-600">{description}</EmptyDescription>
      </EmptyHeader>
      {onRetry ? (
        <EmptyContent>
          <Button variant="outline" onClick={onRetry}>
            <RotateCwIcon />
            Coba lagi
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
