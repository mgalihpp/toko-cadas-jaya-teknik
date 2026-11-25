"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  HeartIcon,
  HomeIcon,
  LayoutGridIcon,
  LogInIcon,
  LogOutIcon,
  PhoneIcon,
  ReceiptTextIcon,
  TagIcon,
  TriangleAlertIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useIsCustomer } from "@/features/cart";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { SheetClose, SheetRoot, SideDrawer } from "./sheet";
import { useSwipe } from "./use-swipe";

function DrawerLink({
  href,
  icon: Icon,
  label,
  badge,
  active,
}: {
  href: string;
  icon: typeof HomeIcon;
  label: string;
  badge?: number;
  active?: boolean;
}) {
  return (
    <SheetClose asChild>
      <Link
        href={href}
        className={cn(
          "flex h-[52px] items-center gap-3.5 px-4 text-[15px]",
          active ? "bg-brand-100 font-bold text-brand-700" : "font-medium text-ink-900",
        )}
      >
        <Icon className={cn("size-[22px]", active ? "text-brand-700" : "text-brand-600")} strokeWidth={1.9} />
        <span className="flex-1">{label}</span>
        {badge ? (
          <span className="inline-flex rounded-md bg-brand-100 px-2 py-[3px] text-[11px] leading-[1.2] font-bold text-brand-700">
            {badge}
          </span>
        ) : null}
      </Link>
    </SheetClose>
  );
}

const outlineButton =
  "flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-brand-600 bg-white text-[15px] font-bold text-brand-700";

export function StoreDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const trpc = useTRPC();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session, isCustomer } = useIsCustomer();
  const { data: used } = useQuery(
    trpc.catalog.products.queryOptions(
      { condition: "bekas", pageSize: 1, page: 1, sort: "terbaru" },
      { enabled: open }
    )
  );
  const { data: orders } = useQuery(
    trpc.orders.list.queryOptions(undefined, { enabled: open && isCustomer })
  );
  const unpaid =
    orders?.filter((o) => o.status === "menunggu_pembayaran" || o.status === "menunggu_konfirmasi")
      .length ?? 0;
  const swipe = useSwipe<HTMLDivElement>({ onLeft: () => onOpenChange(false) });

  const logout = async () => {
    await signOut();
    queryClient.clear();
    onOpenChange(false);
    router.push("/");
    router.refresh();
  };

  return (
    <SheetRoot open={open} onOpenChange={onOpenChange}>
      <SideDrawer title="Menu">
        <div ref={swipe} className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-col gap-2.5 rounded-tr-[20px] bg-gradient-to-b from-brand-700 to-brand-500 px-4 pt-7 pb-[18px]">
            <span className="flex size-[52px] items-center justify-center rounded-full bg-white">
              <UserIcon className="size-7 text-brand-600" strokeWidth={2} />
            </span>
            <p className="text-[17px] leading-[1.35] font-bold text-white">
              {session ? `Halo, ${session.user.name}` : "Halo, Pengunjung"}
            </p>
            <p className="text-[13px] leading-[1.35] text-[#CFE4F6]">
              {session ? session.user.email : "Masuk untuk melihat pesananmu"}
            </p>
          </div>
          <nav aria-label="Menu" className="flex-1 overflow-y-auto py-2">
            <DrawerLink href="/" icon={HomeIcon} label="Beranda" active={pathname === "/"} />
            <DrawerLink href="/produk" icon={LayoutGridIcon} label="Semua kategori" />
            <DrawerLink href="/produk?kondisi=baru" icon={TagIcon} label="Barang baru" />
            <DrawerLink
              href="/produk?kondisi=bekas"
              icon={TriangleAlertIcon}
              label="Barang bekas"
              badge={used?.total}
            />
            <DrawerLink href="/pesanan" icon={ReceiptTextIcon} label="Pesanan saya" badge={unpaid || undefined} />
            <DrawerLink href="/favorit" icon={HeartIcon} label="Favorit" />
            <DrawerLink href="/kontak" icon={PhoneIcon} label="Kontak dan lokasi" />
          </nav>
          <div className="flex flex-col gap-2 border-t border-ink-200 px-4 pt-3 pb-5">
            {session ? (
              <button type="button" onClick={logout} className={outlineButton}>
                <LogOutIcon className="size-5" />
                Keluar
              </button>
            ) : (
              <SheetClose asChild>
                <Link href="/masuk" className={outlineButton}>
                  <LogInIcon className="size-5" />
                  Masuk atau daftar
                </Link>
              </SheetClose>
            )}
            <p className="text-center text-[11px] text-ink-500">Cadas Jaya Teknik</p>
          </div>
        </div>
      </SideDrawer>
    </SheetRoot>
  );
}
