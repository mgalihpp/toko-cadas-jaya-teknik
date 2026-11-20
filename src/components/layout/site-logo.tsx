import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      className={cn("size-9 shrink-0", className)}
    >
      <rect width="40" height="40" rx="10" className="fill-brand-600" />
      <path
        d="M20 6.5 31.7 13.25v13.5L20 33.5 8.3 26.75v-13.5L20 6.5Z"
        fill="white"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M24.3 15.7A6.2 6.2 0 1 0 24.3 24.3"
        className="stroke-brand-600"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SiteLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label="Cadas Jaya Teknik">
      <BrandMark />
      <span className="font-heading text-[19px] leading-none font-bold tracking-tight text-ink-900">
        Cadas Jaya Teknik
      </span>
    </Link>
  );
}
