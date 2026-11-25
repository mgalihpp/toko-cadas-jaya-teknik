"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, ClockIcon, MapPinIcon, PhoneIcon, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { MLink } from "@/components/mobile/m-button";
import { TopBar } from "@/components/mobile/top-bar";
import { ErrorState } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { parseWeek, summarizeWeek } from "@/features/admin-settings/hours";
import { useTRPC } from "@/trpc/client";
import { STORE_MAPS_EMBED_URL, STORE_MAPS_URL } from "../store-location";

function Row({
  icon: Icon,
  label,
  action,
  children,
}: {
  icon: LucideIcon;
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-ink-200 bg-white px-4 py-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100">
        <Icon className="size-5 text-brand-600" strokeWidth={1.8} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <p className="text-xs text-ink-500">{label}</p>
        <div className="text-sm font-medium break-words text-ink-900">{children}</div>
      </div>
      {action}
    </div>
  );
}

function NotSet() {
  return <span className="font-normal text-ink-500">Belum diatur</span>;
}

export function ContactPage() {
  const trpc = useTRPC();
  const { data, isPending, isError, refetch } = useQuery(trpc.settings.get.queryOptions());
  const address = data?.address.trim() ?? "";
  const phone = data?.phone.trim() ?? "";
  const hours = data?.openingHours.trim() ? summarizeWeek(parseWeek(data.openingHours)) : null;
  const tel = `tel:${phone.replace(/[^\d+]/g, "")}`;

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Alamat disalin");
    } catch {
      toast.error("Gagal menyalin alamat");
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Kontak dan lokasi" backHref="/saya" cart={false} />
      {isPending ? (
        <div role="status" className="flex flex-col gap-px">
          <Skeleton className="h-[190px] rounded-none" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[64px] rounded-none" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState title="Gagal memuat informasi kontak" onRetry={() => void refetch()} />
      ) : (
        <>
          <div className="relative h-[190px] bg-brand-100">
            <iframe
              src={STORE_MAPS_EMBED_URL}
              title="Lokasi Cadas Jaya Teknik di Google Maps"
              className="size-full border-0"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <a
              href={STORE_MAPS_URL}
              target="_blank"
              rel="noreferrer"
              className="absolute right-3 bottom-3 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-brand-700 shadow-[0_2px_8px_rgba(10,40,70,.2)]"
            >
              Buka di peta
            </a>
          </div>
          <Row
            icon={MapPinIcon}
            label="Alamat"
            action={
              address ? (
                <button type="button" onClick={copyAddress} className="text-[13px] font-bold text-brand-600">
                  Salin
                </button>
              ) : null
            }
          >
            {address ? <span className="whitespace-pre-line">{address}</span> : <NotSet />}
          </Row>
          <Row
            icon={PhoneIcon}
            label="Telepon"
            action={
              phone ? (
                <a href={tel} className="text-[13px] font-bold text-brand-600">
                  Telepon
                </a>
              ) : null
            }
          >
            {phone || <NotSet />}
          </Row>
          <Row icon={ClockIcon} label="Jam operasional">
            {hours?.open ? hours.open : <NotSet />}
          </Row>
          {hours?.closed ? (
            <Row icon={CalendarIcon} label="Hari libur">
              {hours.closed}
            </Row>
          ) : null}
          {phone ? (
            <div className="p-4">
              <MLink href={tel} size="lg" block>
                <PhoneIcon className="size-[18px]" />
                Telepon toko
              </MLink>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
