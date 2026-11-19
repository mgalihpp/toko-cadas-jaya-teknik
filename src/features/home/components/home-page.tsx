import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  CategoryStrip,
  CategoryStripSkeleton,
  LatestProductsGrid,
  LatestProductsSkeleton,
  SectionShell,
  UsedPicks,
} from "./catalog-sections";
import { Hero } from "./hero";
import {
  Faq,
  HowToOrder,
  NewVsUsed,
  PromoBanner,
  VisitStore,
  VisitStoreDetails,
  VisitStoreSkeleton,
} from "./info-sections";

export function HomePage() {
  return (
    <div className="flex flex-col">
      <Hero />

      <SectionShell className="flex flex-col gap-6 pt-6 pb-16 lg:pb-[72px]" aria-labelledby="kategori">
        <div className="flex items-center justify-between gap-4">
          <h2 id="kategori" className="text-2xl font-bold text-ink-900 lg:text-[28px]">
            Belanja per kategori
          </h2>
          <Button asChild variant="ghost" className="h-10 px-3 font-semibold">
            <Link href="/produk">Semua kategori</Link>
          </Button>
        </div>
        <Suspense fallback={<CategoryStripSkeleton />}>
          <CategoryStrip />
        </Suspense>
      </SectionShell>

      <SectionShell className="flex flex-col gap-8 pt-4 pb-16 lg:pt-12 lg:pb-24" aria-labelledby="terbaru">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <h2 id="terbaru" className="text-3xl font-bold tracking-tight text-ink-900 lg:text-4xl">
              Baru masuk
            </h2>
            <p className="text-base text-ink-600">Diperbarui otomatis saat Owner menambah produk</p>
          </div>
          <Button asChild variant="outline" className="h-11 w-fit border-ink-300 px-4 font-semibold">
            <Link href="/produk">Lihat katalog</Link>
          </Button>
        </div>
        <Suspense fallback={<LatestProductsSkeleton />}>
          <LatestProductsGrid />
        </Suspense>
      </SectionShell>

      <NewVsUsed />

      <Suspense fallback={null}>
        <UsedPicks />
      </Suspense>

      <HowToOrder />

      <Suspense fallback={null}>
        <PromoBanner />
      </Suspense>

      <VisitStore>
        <Suspense fallback={<VisitStoreSkeleton />}>
          <VisitStoreDetails />
        </Suspense>
      </VisitStore>

      <Faq />
    </div>
  );
}
