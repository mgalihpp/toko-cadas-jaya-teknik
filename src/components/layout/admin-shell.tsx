"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BellIcon,
  BoxesIcon,
  ChartColumnIcon,
  ChevronRightIcon,
  CogIcon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PackageIcon,
  ReceiptTextIcon,
  SearchIcon,
  SettingsIcon,
  ShapesIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

type NavCount = "orders" | "stock";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: NavCount;
  external?: boolean;
};

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Utama",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon },
      { href: "/admin/pesanan", label: "Pesanan", icon: ReceiptTextIcon, count: "orders" },
      { href: "/admin/transaksi", label: "Transaksi", icon: WalletIcon },
    ],
  },
  {
    label: "Katalog",
    items: [
      { href: "/admin/produk", label: "Produk", icon: PackageIcon },
      { href: "/admin/kategori", label: "Kategori", icon: ShapesIcon },
      { href: "/admin/stok", label: "Stok", icon: BoxesIcon, count: "stock" },
    ],
  },
  {
    label: "Lainnya",
    items: [
      { href: "/admin/laporan", label: "Laporan", icon: ChartColumnIcon },
      { href: "/admin/pengaturan", label: "Pengaturan", icon: SettingsIcon },
      { href: "/", label: "Lihat toko", icon: ExternalLinkIcon, external: true },
    ],
  },
];

const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items).filter((item) => !item.external);

const COUNT_TONE: Record<NavCount, string> = {
  orders: "bg-brand-600 text-white",
  stock: "bg-warning-soft text-warning",
};

const LOW_STOCK_LIMIT = 10;

function useAttentionCounts() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.admin.finance.dashboard.queryOptions());
  if (!data) return null;
  return {
    awaitingConfirmation: data.awaitingConfirmation,
    counts: {
      orders: data.awaitingConfirmation + data.inProcess,
      stock: data.lowStock.length,
    } satisfies Record<NavCount, number>,
  };
}

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export type AdminShellUser = { name: string; email: string };

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

function CountBadge({ kind, value }: { kind: NavCount; value: number }) {
  if (value <= 0) return null;
  const label = kind === "stock" && value >= LOW_STOCK_LIMIT ? `${LOW_STOCK_LIMIT}+` : String(value);
  return (
    <span
      className={cn(
        "rounded-full px-[7px] py-0.5 text-[11px] leading-[13px] font-bold tabular-nums",
        COUNT_TONE[kind],
      )}
    >
      {label}
    </span>
  );
}

function NavMenu({ pathname }: { pathname: string | null }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const attention = useAttentionCounts();
  return NAV_GROUPS.map((group) => (
    <SidebarGroup key={group.label} className="gap-2.5 p-0">
      <SidebarGroupLabel className="h-auto rounded-none px-0 text-[11px] leading-[13px] font-semibold tracking-[1px] text-ink-500 uppercase">
        {group.label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {group.items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={!item.external && isActive(pathname, item.href)}
                className="h-[38px] gap-2.5 rounded-md px-2.5 font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900 active:bg-ink-100 active:text-ink-900 data-active:bg-brand-50 data-active:font-semibold data-active:text-brand-700 [&_svg]:size-[18px]"
              >
                <Link
                  href={item.href}
                  {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                  }}
                >
                  <item.icon />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.count && attention ? (
                    <CountBadge kind={item.count} value={attention.counts[item.count]} />
                  ) : null}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ));
}

function ActiveNavMenu() {
  const pathname = usePathname();
  return <NavMenu pathname={pathname} />;
}

function SignOutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return (
    <button
      type="button"
      aria-label="Keluar"
      title="Keluar"
      className="-m-1.5 flex size-7 shrink-0 items-center justify-center rounded-md text-ink-500 outline-none hover:bg-ink-100 hover:text-error focus-visible:ring-2 focus-visible:ring-ring"
      onClick={async () => {
        await signOut();
        queryClient.clear();
        router.push("/admin/masuk");
        router.refresh();
      }}
    >
      <LogOutIcon className="size-4" />
    </button>
  );
}

function AdminSidebar({ user }: { user: AdminShellUser }) {
  return (
    <Sidebar className="border-ink-200 [&_[data-slot=sidebar-inner]]:bg-ink-50">
      <SidebarHeader className="pt-6 pr-[15px] pb-0 pl-4">
        <Link href="/admin" className="flex items-center gap-2.5 px-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-brand-600 text-white">
            <CogIcon className="size-[18px]" />
          </span>
          <span className="flex flex-col">
            <span className="font-heading text-[15px] leading-[19px] font-bold text-ink-900">Cadas Jaya</span>
            <span className="text-[11px] leading-[13px] text-ink-500">Panel Owner</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-7 pt-7 pr-[15px] pl-4">
        <Suspense fallback={<NavMenu pathname={null} />}>
          <ActiveNavMenu />
        </Suspense>
      </SidebarContent>
      <SidebarFooter className="pt-2 pr-[15px] pb-6 pl-4">
        <div className="flex items-center gap-2.5 rounded-[10px] border border-ink-200 bg-white p-[9px]">
          <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] leading-4 font-semibold text-ink-900">{user.name}</p>
            <p className="truncate text-xs leading-[15px] text-ink-500">{user.email}</p>
          </div>
          <SignOutButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function Crumb({ pathname }: { pathname: string | null }) {
  const current = pathname
    ? [...NAV_ITEMS].sort((a, b) => b.href.length - a.href.length).find((item) => isActive(pathname, item.href))
    : undefined;
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-[13px] leading-4">
      <span className="text-ink-500">Panel</span>
      {current ? (
        <>
          <ChevronRightIcon className="size-3.5 shrink-0 text-ink-300" aria-hidden />
          <span className="truncate font-semibold text-ink-900">{current.label}</span>
        </>
      ) : null}
    </nav>
  );
}

function ActiveCrumb() {
  const pathname = usePathname();
  return <Crumb pathname={pathname} />;
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

function TopbarSearch() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Form
      action="/admin/pesanan"
      role="search"
      className="hidden h-9 w-[260px] items-center gap-2 rounded-md bg-ink-100 px-3 focus-within:ring-2 focus-within:ring-ring/50 lg:flex"
    >
      <SearchIcon className="size-[15px] shrink-0 text-ink-500" aria-hidden />
      <input
        ref={inputRef}
        type="search"
        name="q"
        aria-label="Cari pesanan"
        placeholder="Cari pesanan atau produk"
        className="min-w-0 flex-1 bg-transparent text-[13px] leading-4 text-ink-900 outline-none placeholder:text-ink-500 [&::-webkit-search-cancel-button]:hidden"
      />
      <kbd className="rounded-[4px] border border-ink-300 px-[5px] font-sans text-[11px] leading-[13px] text-ink-500">
        /
      </kbd>
    </Form>
  );
}

function NotificationBell() {
  const attention = useAttentionCounts();
  const pending = attention?.awaitingConfirmation ?? 0;
  return (
    <Link
      href="/admin/pesanan?status=menunggu_konfirmasi"
      aria-label={pending > 0 ? `${pending} pesanan menunggu konfirmasi` : "Pesanan menunggu konfirmasi"}
      title="Pesanan menunggu konfirmasi"
      className="relative flex size-9 shrink-0 items-center justify-center rounded-md border border-ink-200 text-ink-700 outline-none hover:bg-ink-50 focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <BellIcon className="size-[18px]" aria-hidden />
      {pending > 0 ? (
        <span aria-hidden className="absolute top-[7px] right-[6px] size-[7px] rounded-full bg-brand-600" />
      ) : null}
    </Link>
  );
}

function AdminTopbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-ink-200 bg-white px-4 md:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-1 size-9 md:hidden" aria-label="Buka menu" />
        <Suspense fallback={<Crumb pathname={null} />}>
          <ActiveCrumb />
        </Suspense>
      </div>
      <div className="flex items-center gap-3">
        <TopbarSearch />
        <NotificationBell />
      </div>
    </header>
  );
}

export function AdminShell({
  user,
  children,
}: {
  user: AdminShellUser;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminSidebar user={user} />
      <SidebarInset className="min-w-0 bg-white">
        <AdminTopbar />
        <div className="flex flex-1 flex-col p-4 md:px-8 md:pt-8 md:pb-12">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
