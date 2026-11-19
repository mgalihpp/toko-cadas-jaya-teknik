"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  BoxesIcon,
  ChartColumnIcon,
  ChevronRightIcon,
  CogIcon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PackageIcon,
  ReceiptTextIcon,
  SettingsIcon,
  ShapesIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
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

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Utama",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon },
      { href: "/admin/pesanan", label: "Pesanan", icon: ReceiptTextIcon },
      { href: "/admin/transaksi", label: "Transaksi", icon: WalletIcon },
    ],
  },
  {
    label: "Katalog",
    items: [
      { href: "/admin/produk", label: "Produk", icon: PackageIcon },
      { href: "/admin/kategori", label: "Kategori", icon: ShapesIcon },
      { href: "/admin/stok", label: "Stok", icon: BoxesIcon },
    ],
  },
  {
    label: "Lainnya",
    items: [
      { href: "/admin/laporan", label: "Laporan", icon: ChartColumnIcon },
      { href: "/admin/pengaturan", label: "Pengaturan", icon: SettingsIcon },
    ],
  },
];

const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

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

function NavMenu({ pathname }: { pathname: string | null }) {
  const { isMobile, setOpenMobile } = useSidebar();
  return NAV_GROUPS.map((group) => (
    <SidebarGroup key={group.label} className="px-0 py-0">
      <SidebarGroupLabel className="h-auto px-0 pb-1.5 text-[11px] font-semibold tracking-wider text-ink-500 uppercase">
        {group.label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {group.items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(pathname, item.href)}
                className="h-[38px] gap-2.5 rounded-lg px-2.5 font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900 data-active:bg-brand-50 data-active:font-semibold data-active:text-brand-700 [&_svg]:size-[18px]"
              >
                <Link
                  href={item.href}
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                  }}
                >
                  <item.icon />
                  <span>{item.label}</span>
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
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Keluar"
      title="Keluar"
      className="text-ink-500 hover:text-error"
      onClick={async () => {
        await signOut();
        queryClient.clear();
        router.push("/admin/masuk");
        router.refresh();
      }}
    >
      <LogOutIcon />
    </Button>
  );
}

function AdminSidebar({ user }: { user: AdminShellUser }) {
  return (
    <Sidebar className="border-ink-200 [&_[data-slot=sidebar-inner]]:bg-ink-50">
      <SidebarHeader className="px-4 pt-6 pb-0">
        <Link href="/admin" className="flex items-center gap-2.5 px-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <CogIcon className="size-[18px]" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-[15px] font-bold text-ink-900">Cadas Jaya</span>
            <span className="text-[11px] text-ink-500">Panel Owner</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-7 px-4 pt-7">
        <Suspense fallback={<NavMenu pathname={null} />}>
          <ActiveNavMenu />
        </Suspense>
      </SidebarContent>
      <SidebarFooter className="px-4 pb-6">
        <div className="flex items-center gap-2.5 rounded-[10px] border border-ink-200 bg-white p-2.5">
          <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink-900">{user.name}</p>
            <p className="truncate text-xs text-ink-500">{user.email}</p>
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
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-[13px]">
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

function AdminTopbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-ink-200 bg-white px-4 md:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-1 size-9 md:hidden" aria-label="Buka menu" />
        <Suspense fallback={<Crumb pathname={null} />}>
          <ActiveCrumb />
        </Suspense>
      </div>
      <Button asChild variant="outline" className="h-9 rounded-lg border-ink-200 px-3 text-ink-700">
        <Link href="/" target="_blank" rel="noreferrer">
          <ExternalLinkIcon />
          <span className="hidden sm:inline">Lihat toko</span>
        </Link>
      </Button>
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
        <div className="flex flex-1 flex-col p-4 md:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
