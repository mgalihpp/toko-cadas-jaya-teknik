"use client";

import { BellIcon, CheckIcon, ClockIcon, StoreIcon, TriangleAlertIcon, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { MLink } from "@/components/mobile/m-button";
import { EmptyState } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsCustomer } from "@/features/cart";
import { cn } from "@/lib/utils";
import { useMarkAllRead, useNotificationFeed } from "../hooks/use-notifications";

function relativeTime(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Kemarin";
  return `${days} hari lalu`;
}

const ICONS: Record<string, { icon: LucideIcon; tone: string }> = {
  "Pembayaran dikonfirmasi": { icon: CheckIcon, tone: "bg-success-soft text-success" },
  "Pesanan selesai": { icon: CheckIcon, tone: "bg-success-soft text-success" },
  "Pesanan diproses": { icon: ClockIcon, tone: "bg-brand-100 text-brand-700" },
  "Bukti transfer ditolak": { icon: TriangleAlertIcon, tone: "bg-error-soft text-error" },
  "Pesanan dibatalkan": { icon: TriangleAlertIcon, tone: "bg-error-soft text-error" },
  "Segera bayar": { icon: ClockIcon, tone: "bg-warning-soft text-warning" },
  "Stok baru masuk": { icon: StoreIcon, tone: "bg-brand-100 text-brand-600" },
};

function Header({ onMarkAll, disabled }: { onMarkAll?: () => void; disabled?: boolean }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-0.5 border-b border-ink-200 bg-white px-1">
      <span className="w-3" />
      <h1 className="flex-1 text-[17px] font-bold text-ink-900">Notifikasi</h1>
      {onMarkAll ? (
        <button
          type="button"
          onClick={onMarkAll}
          disabled={disabled}
          className="px-3 text-[13px] font-bold text-brand-600 disabled:text-ink-500"
        >
          Tandai semua dibaca
        </button>
      ) : null}
    </header>
  );
}

export function NotificationsPage() {
  const { session, isPending: sessionPending, isCustomer } = useIsCustomer();
  const feed = useNotificationFeed();
  const markAll = useMarkAllRead();
  const items = feed.data?.items ?? [];
  const unread = feed.data?.unreadCount ?? 0;

  if (sessionPending || (isCustomer && feed.isPending)) {
    return (
      <div className="flex flex-1 flex-col">
        <Header />
        <div role="status" className="flex flex-col">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 border-b border-ink-200 bg-white px-3 py-3.5">
              <Skeleton className="size-[42px] rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!session || !isCustomer) {
    return (
      <div className="flex flex-1 flex-col">
        <Header />
        <EmptyState
          icon={BellIcon}
          title="Masuk untuk melihat notifikasi"
          description="Kabar pembayaran dan pesananmu muncul di sini."
          action={
            <MLink href="/masuk?next=/notifikasi" className="h-[46px] px-6">
              Masuk
            </MLink>
          }
        />
      </div>
    );
  }

  const groups = [
    { key: "pesanan", label: "Update pesanan" },
    { key: "info", label: "Info toko" },
  ] as const;

  return (
    <div className="flex flex-1 flex-col">
      <Header onMarkAll={() => markAll.mutate()} disabled={unread === 0 || markAll.isPending} />
      {items.length === 0 ? (
        <EmptyState
          icon={BellIcon}
          title="Belum ada notifikasi"
          description="Kabar pembayaran, pesanan, dan info toko akan muncul di sini."
        />
      ) : (
        groups.map((group) => {
          const rows = items.filter((i) => i.group === group.key);
          if (rows.length === 0) return null;
          return (
            <section key={group.key}>
              <h2 className="px-3 pt-3.5 pb-1.5 text-[13px] font-bold text-ink-500 first:pt-2.5">{group.label}</h2>
              <ul>
                {rows.map((item) => {
                  const { icon: Icon, tone } = ICONS[item.title] ?? ICONS["Pesanan diproses"];
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-start gap-3 border-b border-ink-200 px-3 py-3.5",
                          item.unread ? "bg-brand-50" : "bg-white",
                        )}
                      >
                        <span className={cn("flex size-[42px] shrink-0 items-center justify-center rounded-full", tone)}>
                          <Icon className="size-5" strokeWidth={2} />
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <p className="text-sm font-bold text-ink-900">{item.title}</p>
                          <p className="text-[13px] text-ink-500">{item.body}</p>
                          <p className="text-xs text-ink-500">{relativeTime(item.at)}</p>
                        </div>
                        {item.unread ? (
                          <span aria-label="Belum dibaca" className="mt-1 size-2.5 shrink-0 rounded-full bg-brand-600" />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
