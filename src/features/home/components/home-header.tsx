"use client";

import { SearchIcon, TruckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { CartButton, NotifButton } from "@/components/mobile/header-buttons";

export function HomeNotice() {
  return (
    <div className="flex h-[30px] items-center justify-center gap-1.5 bg-brand-900 text-xs text-white">
      <TruckIcon className="size-3.5 text-brand-300" strokeWidth={2} />
      Kirim atau ambil sendiri. Tunai atau transfer.
    </div>
  );
}

export function HomeHeader() {
  const router = useRouter();
  return (
    <div className="bg-gradient-to-b from-brand-700 to-brand-600 px-3 pt-3 pb-3.5">
      <div className="flex items-center gap-1">
        <form
          role="search"
          className="flex h-11 flex-1 items-center gap-2 rounded-[10px] bg-white px-3"
          onSubmit={(e) => {
            e.preventDefault();
            const q = new FormData(e.currentTarget).get("q");
            const text = typeof q === "string" ? q.trim() : "";
            router.push(text ? `/produk?q=${encodeURIComponent(text)}` : "/produk");
          }}
        >
          <SearchIcon className="size-5 shrink-0 text-brand-600" strokeWidth={2} />
          <input
            type="search"
            name="q"
            aria-label="Cari produk"
            placeholder="Cari alat teknik di Cadas Jaya"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-500 [&::-webkit-search-cancel-button]:hidden"
          />
        </form>
        <CartButton tone="light" />
        <NotifButton tone="light" />
      </div>
    </div>
  );
}
