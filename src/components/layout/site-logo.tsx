import { CogIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function SiteLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <span className="flex size-9 items-center justify-center rounded-[9px] bg-brand-600 text-white">
        <CogIcon className="size-5" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-heading text-[17px] font-bold text-ink-900">Cadas Jaya</span>
        <span className="mt-0.5 text-[10px] font-bold tracking-[0.2em] text-brand-600">
          TEKNIK
        </span>
      </span>
    </Link>
  );
}
