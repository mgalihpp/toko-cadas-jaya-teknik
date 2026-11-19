"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";

const LINK_GROUPS = [
  {
    title: "Belanja",
    links: [
      { href: "/produk", label: "Semua Produk" },
      { href: "/produk?condition=baru", label: "Barang Baru" },
      { href: "/produk?condition=bekas", label: "Barang Bekas" },
      { href: "/produk", label: "Kategori" },
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
] as const;

function StoreContact() {
  const trpc = useTRPC();
  const { data, isPending, isError } = useQuery(trpc.settings.get.queryOptions());

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-56 bg-ink-700" />
        <Skeleton className="h-4 w-32 bg-ink-700" />
        <Skeleton className="h-4 w-48 bg-ink-700" />
      </div>
    );
  }

  const lines = isError
    ? []
    : [data.address, data.phone, data.openingHours].filter((line) => line.trim() !== "");

  if (lines.length === 0) {
    return (
      <Link href="/kontak" className="text-sm text-ink-300 hover:text-white">
        Lihat halaman kontak
      </Link>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {lines.map((line) => (
        <li key={line} className="text-sm whitespace-pre-line text-ink-300">
          {line}
        </li>
      ))}
    </ul>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-ink-900 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 pt-14 pb-8 sm:px-6 lg:px-10 lg:pt-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1fr_160px_160px_280px] lg:gap-12">
          <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
            <p className="font-heading text-2xl font-bold">Cadas Jaya Teknik</p>
            <p className="max-w-sm text-sm text-ink-300">
              Alat dan mesin teknik baru maupun bekas yang sudah dicek, untuk bengkel,
              kontraktor, dan rumah.
            </p>
          </div>
          {LINK_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <p className="text-[13px] font-semibold">{group.title}</p>
              <ul className="flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-ink-300 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-1">
            <p className="text-[13px] font-semibold">Toko</p>
            <StoreContact />
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-ink-700 pt-6 text-[13px] text-ink-300 sm:flex-row sm:justify-between">
          <p>2026 Cadas Jaya Teknik</p>
          <p>Bayar tunai atau transfer bank</p>
        </div>
      </div>
    </footer>
  );
}
