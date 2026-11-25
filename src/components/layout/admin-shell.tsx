"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BellIcon,
  ChartColumnIcon,
  ChevronLeftIcon,
  FileTextIcon,
  LayoutGridIcon,
  ListIcon,
  LogOutIcon,
  MenuIcon,
  PackageIcon,
  ReceiptTextIcon,
  SettingsIcon,
  StoreIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { PullToRefresh } from "@/components/mobile/pull-to-refresh";
import { SheetClose, SheetRoot, SideDrawer } from "@/components/mobile/sheet";
import { useSwipe } from "@/components/mobile/use-swipe";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

export type AdminShellUser = { name: string; email: string };

type Counts = { orders: number; stock: number };

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: keyof Counts;
};

const DRAWER_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dasbor", icon: ChartColumnIcon },
  { href: "/admin/produk", label: "Produk", icon: PackageIcon },
  { href: "/admin/kategori", label: "Kategori", icon: LayoutGridIcon },
  { href: "/admin/stok", label: "Stok", icon: ListIcon, count: "stock" },
  { href: "/admin/pesanan", label: "Pesanan", icon: ReceiptTextIcon, count: "orders" },
  { href: "/admin/transaksi", label: "Transaksi", icon: WalletIcon },
  { href: "/admin/laporan", label: "Laporan penjualan", icon: FileTextIcon },
  { href: "/admin/pengaturan", label: "Pengaturan toko", icon: SettingsIcon },
];

const TAB_ITEMS = [
  { href: "/admin", label: "Dasbor", icon: ChartColumnIcon },
  { href: "/admin/pesanan", label: "Pesanan", icon: ReceiptTextIcon },
  { href: "/admin/produk", label: "Produk", icon: PackageIcon },
] as const;

const ROOT_PATHS = ["/admin", "/admin/pesanan", "/admin/produk"];
const NAV_HIDDEN = ["/admin/pengaturan", "/admin/produk/", "/admin/pesanan/", "/admin/kategori/"];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function useAdminCounts() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.admin.finance.dashboard.queryOptions());
  return {
    awaiting: data?.awaitingConfirmation ?? 0,
    counts: {
      orders: (data?.awaitingConfirmation ?? 0) + (data?.inProcess ?? 0),
      stock: data?.lowStock.length ?? 0,
    } satisfies Counts,
  };
}

const MenuContext = createContext<() => void>(() => {});

const headerButton =
  "relative flex size-11 shrink-0 items-center justify-center rounded-full text-white";

export function AdminHeader({
  title,
  subtitle,
  backHref,
  right,
  badge,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  backHref?: string;
  right?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const openMenu = useContext(MenuContext);
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 flex h-[60px] shrink-0 items-center gap-0.5 bg-gradient-to-b from-brand-900 to-brand-700 px-1">
      {backHref !== undefined ? (
        backHref ? (
          <Link href={backHref} aria-label="Kembali" className={headerButton}>
            <ChevronLeftIcon className="size-6" strokeWidth={1.8} />
          </Link>
        ) : (
          <button type="button" aria-label="Kembali" onClick={() => router.back()} className={headerButton}>
            <ChevronLeftIcon className="size-6" strokeWidth={1.8} />
          </button>
        )
      ) : (
        <button type="button" aria-label="Buka menu" onClick={openMenu} className={headerButton}>
          <MenuIcon className="size-6" strokeWidth={1.8} />
        </button>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="truncate text-[17px] leading-[1.35] font-bold text-white">{title}</h1>
        {subtitle ? <p className="truncate text-xs leading-[1.35] text-[#CFE4F6]">{subtitle}</p> : null}
      </div>
      {badge}
      {right}
    </header>
  );
}

export function AdminBellButton() {
  const { awaiting } = useAdminCounts();
  return (
    <Link
      href="/admin/pesanan?status=menunggu_konfirmasi"
      aria-label={awaiting > 0 ? `${awaiting} pesanan menunggu konfirmasi` : "Pesanan menunggu konfirmasi"}
      className={headerButton}
    >
      <BellIcon className="size-6" strokeWidth={1.8} />
      {awaiting > 0 ? (
        <span className="absolute top-0.5 right-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-brand-700 bg-accent-yellow px-1 text-[11px] leading-none font-bold text-ink-900">
          {awaiting}
        </span>
      ) : null}
    </Link>
  );
}

export function AdminHeaderAction({
  label,
  onClick,
  href,
  children,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
}) {
  if (href) {
    return (
      <Link href={href} aria-label={label} className={headerButton}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" aria-label={label} onClick={onClick} className={headerButton}>
      {children}
    </button>
  );
}

function AdminDrawer({
  open,
  onOpenChange,
  user,
  counts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminShellUser;
  counts: Counts;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const swipe = useSwipe<HTMLDivElement>({ onLeft: () => onOpenChange(false) });
  return (
    <SheetRoot open={open} onOpenChange={onOpenChange}>
      <SideDrawer title="Menu admin">
        <div ref={swipe} className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-col gap-2 rounded-tr-[20px] bg-gradient-to-b from-brand-900 to-brand-600 px-4 pt-[30px] pb-[18px]">
            <span className="flex size-[52px] items-center justify-center rounded-full bg-white">
              <StoreIcon className="size-7 text-brand-600" strokeWidth={1.9} />
            </span>
            <p className="text-base leading-[1.35] font-bold text-white">{user.name} · Cadas Jaya Teknik</p>
            <p className="text-[13px] leading-[1.35] text-[#CFE4F6]">{user.email}</p>
          </div>
          <nav aria-label="Menu admin" className="flex-1 overflow-y-auto py-2">
            {DRAWER_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              const count = item.count ? counts[item.count] : 0;
              return (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex h-[50px] items-center gap-3.5 px-4 text-[15px]",
                      active ? "bg-brand-100 font-bold text-brand-700" : "font-medium text-ink-900",
                    )}
                  >
                    <item.icon
                      className={cn("size-[22px]", active ? "text-brand-700" : "text-brand-600")}
                      strokeWidth={1.9}
                    />
                    <span className="flex-1">{item.label}</span>
                    {count > 0 ? (
                      <span className="inline-flex rounded-md bg-brand-100 px-2 py-[3px] text-[11px] leading-[1.2] font-bold text-brand-700">
                        {count}
                      </span>
                    ) : null}
                  </Link>
                </SheetClose>
              );
            })}
          </nav>
          <div className="flex flex-col gap-2 border-t border-ink-200 px-4 pt-3 pb-5">
            <button
              type="button"
              onClick={async () => {
                await signOut();
                queryClient.clear();
                onOpenChange(false);
                router.push("/admin/masuk");
                router.refresh();
              }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-error bg-white text-[15px] font-bold text-error"
            >
              <LogOutIcon className="size-5" />
              Keluar
            </button>
          </div>
        </div>
      </SideDrawer>
    </SheetRoot>
  );
}

function AdminBottomNav({ pendingOrders, onMenu }: { pendingOrders: number; onMenu: () => void }) {
  const pathname = usePathname();
  const tab = (active: boolean) =>
    cn(
      "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
      active ? "font-bold text-brand-700" : "font-medium text-ink-500",
    );
  return (
    <nav
      aria-label="Navigasi admin"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto flex h-[68px] w-full max-w-[430px] border-t border-ink-200 bg-white pb-1.5"
    >
      {TAB_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={tab(active)}>
            <span className={cn("mb-[3px] h-[3px] w-6 rounded-sm", active ? "bg-brand-600" : "bg-transparent")} />
            <span className="relative">
              <item.icon className="size-6" strokeWidth={active ? 2 : 1.7} />
              {item.href === "/admin/pesanan" && pendingOrders > 0 ? (
                <span className="absolute -top-1 -right-3 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-error px-1 text-[11px] leading-none font-bold text-white">
                  {pendingOrders}
                </span>
              ) : null}
            </span>
            {item.label}
          </Link>
        );
      })}
      <button type="button" onClick={onMenu} className={tab(false)}>
        <span className="mb-[3px] h-[3px] w-6 rounded-sm bg-transparent" />
        <MenuIcon className="size-6" strokeWidth={1.7} />
        Menu
      </button>
    </nav>
  );
}

export function AdminShell({
  user,
  children,
}: {
  user: AdminShellUser;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { awaiting, counts } = useAdminCounts();
  const isRoot = ROOT_PATHS.includes(pathname);
  const showNav = !NAV_HIDDEN.some((p) => (p.endsWith("/") ? pathname.startsWith(p) : pathname === p));

  useEffect(() => {
    let sx: number | null = null;
    let sy = 0;
    const left = () => Math.max(0, (window.innerWidth - 430) / 2);
    const start = (e: TouchEvent) => {
      const x = e.touches[0].clientX;
      sx = x >= left() && x - left() <= 28 ? x : null;
      sy = e.touches[0].clientY;
    };
    const end = (e: TouchEvent) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (dx < 70 || Math.abs(dy) > dx) return;
      if (isRoot) setOpen(true);
      else router.back();
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchend", end, { passive: true });
    return () => {
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchend", end);
    };
  }, [isRoot, router]);

  return (
    <MenuContext.Provider value={() => setOpen(true)}>
      <main className={cn("flex flex-1 flex-col", showNav && "pb-[68px]")}>{children}</main>
      {showNav ? <AdminBottomNav pendingOrders={awaiting} onMenu={() => setOpen(true)} /> : null}
      <AdminDrawer open={open} onOpenChange={setOpen} user={user} counts={counts} />
      <PullToRefresh />
    </MenuContext.Provider>
  );
}
