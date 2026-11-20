"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CheckIcon,
  ClockIcon,
  CopyIcon,
  MapPinIcon,
  PhoneIcon,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared";
import { GoogleMapsIcon } from "@/components/shared/google-maps-icon";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";
import { STORE_MAPS_EMBED_URL, STORE_MAPS_URL } from "../store-location";

const STORE_PHOTO = "/images/toko-cadas-jaya-teknik.jpg";

const actionClass =
  "inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 text-[13px] font-medium text-ink-900 transition-colors hover:border-ink-300 hover:bg-ink-50";

function toWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
}

function parseHours(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf(":");
      const hasLabel = separator > 0 && !/\d/.test(line.slice(0, separator));
      return hasLabel
        ? {
            label: line.slice(0, separator).trim(),
            value: line.slice(separator + 1).trim(),
          }
        : { label: null, value: line };
    });
}

function InfoRow({
  icon: Icon,
  label,
  children,
  actions,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-ink-200 py-5 sm:py-[22px]">
      <div className="flex min-w-0 items-start gap-4 sm:gap-[18px]">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Icon className="size-5" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[13px] text-ink-500">{label}</p>
          <div className="text-base font-semibold break-words text-ink-900 sm:text-[17px]">
            {children}
          </div>
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap gap-2.5 pl-15 sm:pl-[62px]">{actions}</div>
      ) : null}
    </div>
  );
}

function NotSet() {
  return <span className="font-normal text-ink-500">Belum diatur</span>;
}

function CopyPhoneButton({ phone }: { phone: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={actionClass}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(phone);
          setCopied(true);
          toast.success("Nomor telepon disalin");
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.error("Gagal menyalin nomor");
        }
      }}
    >
      {copied ? (
        <CheckIcon className="size-4 text-green-600" />
      ) : (
        <CopyIcon className="size-4 text-ink-500" />
      )}
      {copied ? "Tersalin" : "Salin nomor"}
    </button>
  );
}

function ContactSkeleton() {
  return (
    <div className="flex flex-col">
      {[0, 1].map((key) => (
        <div
          key={key}
          className="flex items-center gap-[18px] border-b border-ink-200 py-[22px]"
        >
          <Skeleton className="size-11 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function HoursCard({ openingHours }: { openingHours: string | undefined }) {
  const rows = openingHours ? parseHours(openingHours) : [];
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-ink-50 p-6">
      <h2 className="flex items-center gap-2.5 pb-3 font-heading text-lg font-semibold text-ink-900">
        <span className="flex size-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <ClockIcon className="size-4" />
        </span>
        Jam operasional
      </h2>
      {openingHours === undefined ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <p className="px-3 py-2 text-sm text-ink-500">
          Jam operasional belum diatur.
        </p>
      ) : (
        rows.map((row, index) =>
          row.label ? (
            <div
              key={index}
              className="flex items-start justify-between gap-4 rounded-lg px-3 py-[9px] text-sm"
            >
              <span className="text-ink-600">{row.label}</span>
              <span
                className={
                  /tutup|libur/i.test(row.value)
                    ? "text-right text-error"
                    : "text-right text-ink-900"
                }
              >
                {row.value}
              </span>
            </div>
          ) : (
            <p
              key={index}
              className="rounded-lg px-3 py-[9px] text-sm text-ink-900"
            >
              {row.value}
            </p>
          ),
        )
      )}
    </div>
  );
}

export function ContactPage() {
  const trpc = useTRPC();
  const { data, isPending, isError, refetch } = useQuery(
    trpc.settings.get.queryOptions(),
  );

  const address = data?.address.trim() ?? "";
  const phone = data?.phone.trim() ?? "";

  return (
    <>
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12 lg:px-10 xl:grid-cols-[minmax(0,1fr)_520px] xl:gap-16 xl:px-20 lg:pt-[72px] lg:pb-24">
        <div className="flex flex-col gap-8 lg:gap-9">
          <h1 className="font-heading text-[32px] leading-[1.1] font-bold tracking-tight text-ink-900 sm:text-[42px] lg:text-[52px]">
            Datang, telepon, atau pesan online.
          </h1>

          {isPending ? (
            <ContactSkeleton />
          ) : isError ? (
            <ErrorState
              title="Gagal memuat informasi kontak"
              onRetry={() => void refetch()}
            />
          ) : (
            <div className="flex flex-col">
              <InfoRow
                icon={MapPinIcon}
                label="Alamat toko"
                actions={
                  address ? (
                    <a
                      href={STORE_MAPS_URL}
                      target="_blank"
                      rel="noreferrer"
                      className={actionClass}
                    >
                      <GoogleMapsIcon className="size-4" />
                      Buka di Google Maps
                    </a>
                  ) : null
                }
              >
                {address ? (
                  <span className="whitespace-pre-line">{address}</span>
                ) : (
                  <NotSet />
                )}
              </InfoRow>
              <InfoRow
                icon={PhoneIcon}
                label="Telepon dan WhatsApp"
                actions={
                  phone ? (
                    <>
                      <CopyPhoneButton phone={phone} />
                      <a
                        href={`https://wa.me/${toWhatsAppNumber(phone)}`}
                        target="_blank"
                        rel="noreferrer"
                        className={actionClass}
                      >
                        <WhatsAppIcon className="size-4 text-[#25D366]" />
                        WhatsApp
                      </a>
                    </>
                  ) : null
                }
              >
                {phone ? (
                  <a
                    href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                    className="hover:text-brand-600"
                  >
                    {phone}
                  </a>
                ) : (
                  <NotSet />
                )}
              </InfoRow>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={STORE_PHOTO}
            alt="Etalase Cadas Jaya Teknik"
            className="h-72 w-full rounded-[20px] bg-ink-200 object-cover object-[50%_60%] sm:h-[360px]"
          />
          {isError ? null : (
            <HoursCard openingHours={data?.openingHours.trim()} />
          )}
        </div>
      </section>
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-10 lg:pb-24 xl:px-20">
        <iframe
          src={STORE_MAPS_EMBED_URL}
          title="Lokasi Cadas Jaya Teknik di Google Maps"
          className="h-72 w-full rounded-[20px] border-0 bg-ink-200 sm:h-[380px]"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </section>
    </>
  );
}
