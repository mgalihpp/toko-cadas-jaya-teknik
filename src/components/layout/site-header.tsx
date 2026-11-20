"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  ReceiptTextIcon,
  ShoppingBagIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartCount } from "@/features/cart";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { SiteLogo } from "./site-logo";

const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/produk", label: "Produk" },
  { href: "/kontak", label: "Kontak" },
] as const;

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

function useSignOut(redirectTo: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  return async () => {
    await signOut();
    queryClient.clear();
    router.push(redirectTo);
    router.refresh();
  };
}

function NavLinkList({
  pathname,
  variant,
}: {
  pathname: string | null;
  variant: "desktop" | "mobile";
}) {
  return NAV_LINKS.map((link) => {
    const active = isActive(pathname, link.href);
    const node = (
      <Link
        key={link.href}
        href={link.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "text-sm font-medium text-ink-600 transition-colors hover:text-ink-900",
          active && "font-semibold text-ink-900",
          variant === "mobile" &&
            cn("rounded-lg px-3 py-2.5 text-base hover:bg-ink-100", active && "bg-brand-50 text-brand-700")
        )}
      >
        {link.label}
      </Link>
    );
    return variant === "mobile" ? (
      <SheetClose asChild key={link.href}>
        {node}
      </SheetClose>
    ) : (
      node
    );
  });
}

function ActiveNavLinks({ variant }: { variant: "desktop" | "mobile" }) {
  const pathname = usePathname();
  return <NavLinkList pathname={pathname} variant={variant} />;
}

function NavLinks({ variant }: { variant: "desktop" | "mobile" }) {
  return (
    <Suspense fallback={<NavLinkList pathname={null} variant={variant} />}>
      <ActiveNavLinks variant={variant} />
    </Suspense>
  );
}

function CartButton() {
  const count = useCartCount();
  return (
    <Link
      href="/keranjang"
      aria-label={count > 0 ? `Keranjang, ${count} barang` : "Keranjang"}
      className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-ink-200 text-ink-900 transition-colors hover:bg-ink-100"
    >
      <ShoppingBagIcon className="size-[18px]" />
      {count > 0 ? (
        <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

function AccountMenu() {
  const { data: session, isPending } = useSession();
  const handleSignOut = useSignOut("/");

  if (isPending) return <Skeleton className="size-10 rounded-full" />;

  if (!session) {
    return (
      <div className="hidden items-center gap-2 sm:flex">
        <Button asChild className="h-10 rounded-lg bg-brand-600 px-[18px] text-white hover:bg-brand-700">
          <Link href="/masuk">Masuk</Link>
        </Button>
      </div>
    );
  }

  const { user } = session;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Menu akun"
          className="hidden rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand-200 sm:block"
        >
          <Avatar className="size-10">
            <AvatarFallback className="bg-brand-100 text-[13px] font-bold text-brand-700">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-ink-900">{user.name}</span>
          <span className="truncate text-xs font-normal text-ink-500">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === "admin" ? (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <LayoutDashboardIcon />
              Panel admin
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href="/pesanan">
              <ReceiptTextIcon />
              Riwayat pesanan
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          <LogOutIcon />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileAccountLinks() {
  const { data: session, isPending } = useSession();
  const handleSignOut = useSignOut("/");

  if (isPending) return <Skeleton className="h-10 w-full" />;

  if (!session) {
    return (
      <div className="grid gap-2">
        <SheetClose asChild>
          <Button asChild className="h-10 bg-brand-600 text-white hover:bg-brand-700">
            <Link href="/masuk">Masuk</Link>
          </Button>
        </SheetClose>
      </div>
    );
  }

  const { user } = session;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 px-3 py-2">
        <Avatar className="size-10">
          <AvatarFallback className="bg-brand-100 text-[13px] font-bold text-brand-700">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">{user.name}</p>
          <p className="truncate text-xs text-ink-500">{user.email}</p>
        </div>
      </div>
      <SheetClose asChild>
        <Link
          href={user.role === "admin" ? "/admin" : "/pesanan"}
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
        >
          {user.role === "admin" ? (
            <LayoutDashboardIcon className="size-4" />
          ) : (
            <ReceiptTextIcon className="size-4" />
          )}
          {user.role === "admin" ? "Panel admin" : "Riwayat pesanan"}
        </Link>
      </SheetClose>
      <SheetClose asChild>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-error hover:bg-error-soft"
        >
          <LogOutIcon className="size-4" />
          Keluar
        </button>
      </SheetClose>
    </div>
  );
}

function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="size-10 rounded-full md:hidden" aria-label="Buka menu">
          <MenuIcon className="size-[18px]" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[85%] gap-0 p-0">
        <SheetHeader className="border-b border-ink-200 p-4">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SiteLogo />
        </SheetHeader>
        <div className="flex flex-col gap-6 p-4">
          <nav className="flex flex-col gap-1" aria-label="Navigasi utama">
            <NavLinks variant="mobile" />
          </nav>
          <div className="border-t border-ink-200 pt-4">
            <MobileAccountLinks />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 md:h-[76px] lg:px-8">
        <SiteLogo />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Navigasi utama">
          <NavLinks variant="desktop" />
        </nav>
        <div className="flex items-center gap-3">
          <CartButton />
          <AccountMenu />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
