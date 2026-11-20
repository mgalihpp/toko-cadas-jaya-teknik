"use client";

import { useQuery } from "@tanstack/react-query";
import { Banknote, Clock, Landmark, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { GoogleMapsIcon } from "@/components/shared/google-maps-icon";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { STORE_MAPS_URL } from "@/features/contact/store-location";
import { useTRPC } from "@/trpc/client";
import { BrandMark } from "./site-logo";

const LINK_GROUPS = [
  {
    title: "Belanja",
    links: [
      { href: "/produk", label: "Semua Produk" },
      { href: "/produk?condition=baru", label: "Barang Baru" },
      { href: "/produk?condition=bekas", label: "Barang Bekas" },
    ],
  },
  {
    title: "Akun",
    links: [
      { href: "/masuk", label: "Masuk" },
      { href: "/daftar", label: "Daftar" },
      { href: "/pesanan", label: "Pesanan Saya" },
      { href: "/keranjang", label: "Keranjang" },
    ],
  },
  {
    title: "Bantuan",
    links: [{ href: "/kontak", label: "Kontak & Lokasi" }],
  },
] as const;

function toWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
}

const ctaButtonClass =
  "inline-flex h-11 min-w-48 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors";

function useStoreSettings() {
  const trpc = useTRPC();
  return useQuery(trpc.settings.get.queryOptions());
}

function FooterCta() {
  const { data } = useStoreSettings();
  const phone = data?.phone.trim() ?? "";

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-ink-700 bg-ink-800 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-2">
        <p className="font-heading text-xl font-bold sm:text-2xl">
          Cari alat atau mesin tertentu?
        </p>
        <p className="max-w-lg text-sm text-ink-300">
          Tanyakan stok dan harga langsung ke toko, atau mampir lihat barangnya.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {phone ? (
          <a
            href={`https://wa.me/${toWhatsAppNumber(phone)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${ctaButtonClass} bg-white text-ink-900 hover:bg-ink-100`}
          >
            <WhatsAppIcon className="size-5 text-[#25D366]" />
            Chat WhatsApp
          </a>
        ) : null}
        <a
          href={STORE_MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${ctaButtonClass} bg-white text-ink-900 hover:bg-ink-100`}
        >
          <GoogleMapsIcon className="size-5" />
          Google Maps
        </a>
      </div>
    </div>
  );
}

function StoreContact() {
  const { data, isPending, isError } = useStoreSettings();

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-56 bg-ink-700" />
        <Skeleton className="h-4 w-32 bg-ink-700" />
        <Skeleton className="h-4 w-48 bg-ink-700" />
      </div>
    );
  }

  const rows = isError
    ? []
    : [
        { icon: MapPin, text: data.address, href: STORE_MAPS_URL },
        { icon: Phone, text: data.phone, href: `tel:${data.phone.replace(/[^\d+]/g, "")}` },
        { icon: Clock, text: data.openingHours, href: undefined },
      ].filter((row) => row.text.trim() !== "");

  if (rows.length === 0) {
    return (
      <Link href="/kontak" className="text-sm text-ink-300 hover:text-white">
        Lihat halaman kontak
      </Link>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.text} className="flex items-start gap-3 text-sm text-ink-300">
          <row.icon className="mt-0.5 size-4 shrink-0 text-brand-500" />
          {row.href ? (
            <a
              href={row.href}
              {...(row.href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="whitespace-pre-line transition-colors hover:text-white"
            >
              {row.text}
            </a>
          ) : (
            <span className="whitespace-pre-line">{row.text}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-ink-900 text-white">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-12 px-4 pt-12 pb-8 sm:px-6 lg:px-8 lg:pt-16">
        <FooterCta />
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:gap-12">
          <div className="flex flex-col gap-5 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <BrandMark />
              <p className="font-heading text-xl font-bold">Cadas Jaya Teknik</p>
            </div>
            <p className="max-w-sm text-sm text-ink-300">
              Alat dan mesin teknik baru maupun bekas yang sudah dicek, untuk bengkel,
              kontraktor, dan rumah.
            </p>
            <StoreContact />
          </div>
          {LINK_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title} className="flex flex-col gap-4">
              <p className="text-[13px] font-semibold tracking-wide text-ink-500 uppercase">
                {group.title}
              </p>
              <ul className="flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-300 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="flex flex-col gap-2 border-t border-ink-700 pt-6 text-[13px] text-ink-500 sm:flex-row sm:justify-between">
          <p>© 2026 Cadas Jaya Teknik. Semua hak dilindungi.</p>
          <div className="flex items-center gap-2">
            <span className="mr-1">Pembayaran</span>
            {[
              { icon: Banknote, label: "Tunai" },
              { icon: Landmark, label: "Transfer bank" },
            ].map((method) => (
              <span
                key={method.label}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-ink-700 bg-ink-800 px-2.5 text-xs font-medium text-ink-300"
              >
                <method.icon className="size-4 text-brand-500" />
                {method.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
