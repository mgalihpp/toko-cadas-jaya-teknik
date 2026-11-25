"use client";

import { HomeIcon, LayoutGridIcon, ReceiptTextIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Beranda", icon: HomeIcon, match: (p: string) => p === "/" },
  { href: "/produk", label: "Katalog", icon: LayoutGridIcon, match: (p: string) => p.startsWith("/produk") },
  { href: "/pesanan", label: "Pesanan", icon: ReceiptTextIcon, match: (p: string) => p.startsWith("/pesanan") },
  { href: "/saya", label: "Saya", icon: UserIcon, match: (p: string) => p.startsWith("/saya") },
] as const;

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto flex h-[68px] w-full max-w-[430px] border-t border-ink-200 bg-white pb-1.5"
    >
      {ITEMS.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
              active ? "font-bold text-brand-700" : "font-medium text-ink-500",
            )}
          >
            <span
              className={cn("mb-[3px] h-[3px] w-6 rounded-sm", active ? "bg-brand-600" : "bg-transparent")}
            />
            <Icon className="size-6" strokeWidth={active ? 2 : 1.7} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
