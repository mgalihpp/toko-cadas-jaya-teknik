import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CONTAINER } from "@/features/catalog";
import { cn } from "@/lib/utils";
import { HeroTypewriter } from "./hero-typewriter";

const POPULAR = ["Bor", "Gerinda", "Kompresor", "Trafo Las"];

const CHIP_CLASS =
  "rounded-full bg-ink-100 px-3.5 py-1.5 text-[13px] text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-700";

function HeroSearch() {
  return (
    <div className="flex flex-col gap-3">
      <form
        action="/produk"
        role="search"
        className="flex h-14 items-center gap-3 rounded-xl border-2 border-ink-300 bg-white pr-2 pl-4 transition-colors focus-within:border-brand-500 lg:h-[60px]"
      >
        <SearchIcon className="size-5 shrink-0 text-ink-500" aria-hidden />
        <input
          name="q"
          type="search"
          aria-label="Cari produk"
          placeholder="Cari bor, gerinda, kompresor, trafo las..."
          className="min-w-0 flex-1 bg-transparent text-base text-ink-900 outline-none placeholder:text-ink-500"
        />
        <Button
          type="submit"
          className="h-10 px-5 font-semibold lg:h-11 lg:px-6"
        >
          Cari
        </Button>
      </form>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm text-ink-500">Sering dicari:</span>
        {POPULAR.map((term) => (
          <Link
            key={term}
            href={`/produk?q=${encodeURIComponent(term)}`}
            className={CHIP_CLASS}
          >
            {term}
          </Link>
        ))}
        <Link href="/produk?kondisi=bekas" className={CHIP_CLASS}>
          Bekas siap pakai
        </Link>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className={cn(CONTAINER, "pt-10 pb-14 lg:pt-20 lg:pb-[88px]")}>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 text-center lg:gap-7">
        <h1 className="text-4xl leading-[1.08] font-bold tracking-tight text-ink-900 sm:text-5xl lg:text-[56px]">
          Alat teknik andal untuk
          <span className="block h-[1.08em] whitespace-nowrap">
            <HeroTypewriter />
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-ink-600 lg:text-lg">
          Kami jual alat teknik baru dan bekas di Cadas, Tangerang.
        </p>
        <HeroSearch />
      </div>
    </section>
  );
}
