"use client";

import { RefreshCwIcon, WifiOffIcon } from "lucide-react";
import { MButton } from "@/components/mobile/m-button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: React.ReactNode;
  onRetry?: () => void;
  secondary?: React.ReactNode;
  className?: string;
};

export function ErrorState({
  title = "Koneksi terputus",
  description = "Periksa jaringanmu, lalu coba muat ulang. Data yang sudah tampil tetap tersimpan sementara.",
  onRetry,
  secondary,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-24 text-center", className)}>
      <span className="flex size-[110px] items-center justify-center rounded-full bg-error-soft">
        <WifiOffIcon className="size-12 text-error" strokeWidth={1.6} />
      </span>
      <h2 className="text-xl leading-[1.35] font-bold text-ink-900">{title}</h2>
      <p className="text-sm leading-[1.35] text-ink-500">{description}</p>
      {onRetry ? (
        <MButton onClick={onRetry} className="px-7">
          <RefreshCwIcon className="size-[18px]" />
          Coba lagi
        </MButton>
      ) : null}
      {secondary}
    </div>
  );
}
