"use client";

import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CartButton } from "./header-buttons";

export function BackButton({ href, className }: { href?: string; className?: string }) {
  const router = useRouter();
  const classes = cn(
    "flex size-11 shrink-0 items-center justify-center rounded-full text-brand-700",
    className,
  );
  if (href) {
    return (
      <Link href={href} aria-label="Kembali" className={classes}>
        <ChevronLeftIcon className="size-6" strokeWidth={1.8} />
      </Link>
    );
  }
  return (
    <button type="button" aria-label="Kembali" onClick={() => router.back()} className={classes}>
      <ChevronLeftIcon className="size-6" strokeWidth={1.8} />
    </button>
  );
}

export function TopBar({
  title,
  backHref,
  hideBack,
  cart = true,
  right,
  className,
}: {
  title: React.ReactNode;
  backHref?: string;
  hideBack?: boolean;
  cart?: boolean;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 shrink-0 items-center gap-0.5 border-b border-ink-200 bg-white px-1",
        className,
      )}
    >
      {hideBack ? <span className="w-3" /> : <BackButton href={backHref} />}
      <h1 className="min-w-0 flex-1 truncate text-[17px] leading-[1.35] font-bold text-ink-900">
        {title}
      </h1>
      {right}
      {cart ? <CartButton /> : null}
    </header>
  );
}
