import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CONTAINER, ProductImage, stockLabel } from "@/features/catalog";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getCategories, getUsedPicks } from "../data";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1569783899817-a49d2d25287c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

async function HeroStats() {
  const [categories, used] = await Promise.all([getCategories(), getUsedPicks()]);
  const total = categories.reduce((sum, c) => sum + Number(c.productCount), 0);
  const stats = [
    { value: String(total), label: "produk tersedia" },
    { value: String(used.total), label: "unit bekas siap pakai" },
    { value: "2", label: "cara bayar" },
  ];
  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-4 pt-3">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col-reverse gap-0.5">
          <dt className="text-[13px] text-ink-500">{stat.label}</dt>
          <dd className="font-heading text-3xl font-bold text-ink-900">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function HeroStatsSkeleton() {
  return (
    <div className="flex gap-10 pt-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-8 w-14 bg-ink-200" />
          <Skeleton className="h-3 w-24 bg-ink-100" />
        </div>
      ))}
    </div>
  );
}

async function HeroFloatingItem() {
  const used = await getUsedPicks();
  const item = used.items.find((p) => p.available > 0);
  if (!item) return null;
  return (
    <Link
      href={`/produk/${item.slug}`}
      className="absolute bottom-4 left-4 flex w-[min(340px,calc(100%-2rem))] items-center gap-3.5 rounded-2xl bg-white p-3.5 shadow-xl shadow-ink-900/10 transition-transform hover:-translate-y-0.5 sm:bottom-8 sm:left-8"
    >
      <ProductImage src={item.image} alt="" className="size-16 shrink-0 rounded-[10px]" />
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex gap-1.5">
          <span className="rounded-full bg-accent-yellow px-2 py-0.5 text-[11px] font-semibold text-ink-900">
            Bekas
          </span>
          <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning">
            {stockLabel(item.available)}
          </span>
        </div>
        <span className="truncate text-sm font-semibold text-ink-900">{item.name}</span>
        <span className="font-heading text-base font-bold text-brand-700">{formatRupiah(item.price)}</span>
      </div>
    </Link>
  );
}

export function Hero() {
  return (
    <section
      className={cn(
        CONTAINER,
        "grid items-center gap-10 pt-8 pb-14 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:gap-14 lg:pt-14 lg:pb-[72px]"
      )}
    >
      <div className="flex flex-col gap-6 lg:gap-7">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-semibold text-brand-700">
          <span className="size-2 rounded-full bg-brand-600" aria-hidden />
          Baru dan bekas, semua dicek sebelum dijual
        </span>
        <h1 className="text-4xl leading-[1.05] font-bold tracking-tight text-ink-900 sm:text-5xl lg:text-[60px]">
          Alat teknik siap kerja, harga jelas sebelum datang.
        </h1>
        <p className="text-base leading-relaxed text-ink-600 lg:text-lg">
          Lihat stok bor, gerinda, kompresor, sampai trafo las. Pesan online, bayar tunai atau
          transfer, lalu ambil di toko atau kami kirim.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="h-12 px-[22px] text-sm font-semibold">
            <Link href="/produk">Lihat Katalog</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 border-ink-300 px-[22px] text-sm font-semibold">
            <Link href="/produk?kondisi=bekas">Barang Bekas</Link>
          </Button>
        </div>
        <Suspense fallback={<HeroStatsSkeleton />}>
          <HeroStats />
        </Suspense>
      </div>
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMAGE}
          alt="Peralatan teknik di bengkel"
          fetchPriority="high"
          className="aspect-[4/3] w-full rounded-3xl bg-ink-100 object-cover lg:aspect-auto lg:h-[560px]"
        />
        <Suspense fallback={null}>
          <HeroFloatingItem />
        </Suspense>
      </div>
    </section>
  );
}
