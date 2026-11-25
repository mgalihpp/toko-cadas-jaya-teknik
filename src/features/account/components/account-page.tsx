"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  HeartIcon,
  LogOutIcon,
  PackageIcon,
  PhoneIcon,
  ReceiptTextIcon,
  ShieldCheckIcon,
  UserIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CartButton } from "@/components/mobile/header-buttons";
import { MLink } from "@/components/mobile/m-button";
import { useIsCustomer } from "@/features/cart";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

const STATUS_LINKS: {
  tab: string;
  label: string;
  icon: LucideIcon;
  statuses: string[];
}[] = [
  { tab: "belum-bayar", label: "Belum bayar", icon: WalletIcon, statuses: ["menunggu_pembayaran"] },
  { tab: "menunggu-konfirmasi", label: "Menunggu konfirmasi", icon: ClockIcon, statuses: ["menunggu_konfirmasi"] },
  { tab: "diproses", label: "Diproses", icon: PackageIcon, statuses: ["dibayar", "diproses"] },
  { tab: "selesai", label: "Selesai", icon: CheckIcon, statuses: ["selesai"] },
];

function MenuRow({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href?: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <Icon className="size-[22px] text-brand-700" strokeWidth={2} />
      <span className="flex-1 text-left text-[15px] font-medium text-ink-900">{label}</span>
      <ChevronRightIcon className="size-[18px] text-ink-500" strokeWidth={2} />
    </>
  );
  const cls = "flex w-full items-center gap-3.5 border-b border-ink-200 bg-white px-4 py-3.5";
  return href ? (
    <Link href={href} className={cls}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {content}
    </button>
  );
}

export function AccountPage() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session, isCustomer } = useIsCustomer();
  const { data: orders } = useQuery(trpc.orders.list.queryOptions(undefined, { enabled: isCustomer }));
  const count = (statuses: string[]) => orders?.filter((o) => statuses.includes(o.status)).length ?? 0;

  async function logout() {
    await signOut();
    queryClient.clear();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3.5 bg-gradient-to-b from-brand-700 to-brand-500 px-4 pt-[18px] pb-14">
        <div className="flex items-center justify-end gap-1">
          <CartButton tone="light" />
        </div>
        <div className="flex items-center gap-3.5">
          <span className="flex size-[60px] shrink-0 items-center justify-center rounded-full bg-white">
            <UserIcon className="size-8 text-brand-600" strokeWidth={2} />
          </span>
          {session ? (
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate text-lg font-bold text-white">{session.user.name}</p>
              <p className="truncate text-[13px] text-[#CFE4F6]">{session.user.email}</p>
            </div>
          ) : (
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-lg font-bold text-white">Halo, Pengunjung</p>
              <p className="text-[13px] text-[#CFE4F6]">Masuk untuk melihat pesananmu</p>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 mx-3 -mt-9 rounded-xl bg-white p-3 shadow-[0_6px_20px_rgba(10,40,70,.12)]">
        <div className="flex items-center gap-2">
          <p className="flex-1 text-[15px] font-bold text-ink-900">Pesanan saya</p>
          <Link href="/pesanan" className="text-[13px] font-bold text-brand-600">
            Lihat riwayat
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-1.5 pt-3">
          {STATUS_LINKS.map(({ tab, label, icon: Icon, statuses }) => {
            const n = count(statuses);
            return (
              <Link
                key={tab}
                href={`/pesanan?tab=${tab}`}
                className="flex flex-col items-center gap-1.5"
              >
                <span className="relative">
                  <Icon className="size-7 text-brand-700" strokeWidth={1.8} />
                  {n > 0 ? (
                    <span className="absolute -top-1.5 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-yellow text-[11px] font-bold text-ink-900">
                      {n}
                    </span>
                  ) : null}
                </span>
                <span className="text-center text-xs font-medium text-ink-900">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="h-3" />
      <MenuRow href="/favorit" icon={HeartIcon} label="Favorit saya" />
      <MenuRow href="/pesanan" icon={ReceiptTextIcon} label="Riwayat pesanan" />
      <MenuRow href="/kontak" icon={PhoneIcon} label="Kontak dan lokasi toko" />
      <MenuRow href="/privasi" icon={ShieldCheckIcon} label="Kebijakan privasi" />
      {session ? (
        <MenuRow icon={LogOutIcon} label="Keluar" onClick={logout} />
      ) : (
        <div className={cn("flex flex-col gap-2.5 p-4")}>
          <MLink href="/masuk?next=/saya" size="lg" block>
            Masuk atau daftar
          </MLink>
        </div>
      )}
    </div>
  );
}
