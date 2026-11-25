"use client";

import { BellIcon, ShoppingCartIcon } from "lucide-react";
import Link from "next/link";
import { useCartCount } from "@/features/cart";
import { useUnreadNotifications } from "@/features/notifications/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { CountBadge } from "./count-badge";

type Tone = "light" | "dark";

const toneClass: Record<Tone, string> = {
  light: "text-white",
  dark: "text-brand-700",
};
const ringClass: Record<Tone, string> = {
  light: "border-brand-700",
  dark: "border-white",
};

export function HeaderIconLink({
  href,
  label,
  tone,
  count,
  children,
}: {
  href: string;
  label: string;
  tone: Tone;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={count > 0 ? `${label}, ${count}` : label}
      className={cn(
        "relative flex size-11 shrink-0 items-center justify-center rounded-full",
        toneClass[tone],
      )}
    >
      {children}
      <CountBadge count={count} ringClass={ringClass[tone]} className="absolute top-0.5 right-0" />
    </Link>
  );
}

export function CartButton({ tone = "dark" }: { tone?: Tone }) {
  const count = useCartCount();
  return (
    <HeaderIconLink href="/keranjang" label="Keranjang" tone={tone} count={count}>
      <ShoppingCartIcon className="size-6" strokeWidth={1.8} />
    </HeaderIconLink>
  );
}

export function NotifButton({ tone = "dark" }: { tone?: Tone }) {
  const count = useUnreadNotifications();
  return (
    <HeaderIconLink href="/notifikasi" label="Notifikasi" tone={tone} count={count}>
      <BellIcon className="size-6" strokeWidth={1.8} />
    </HeaderIconLink>
  );
}
