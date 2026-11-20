import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  CategoryStrip,
  CategoryStripSkeleton,
  LatestProductsGrid,
  LatestProductsSkeleton,
  SectionShell,
} from "./catalog-sections";
import { Hero } from "./hero";
import {
  Faq,
  VisitStore,
  VisitStoreDetails,
  VisitStoreSkeleton,
} from "./info-sections";

export function HomePage() {
  return (
    <div className="flex flex-col">
      <Hero />

      <SectionShell
        className="flex flex-col gap-6 pt-6 pb-16 lg:pb-[72px]"
        aria-labelledby="kategori"
      >
        <div className="flex items-center justify-between gap-4">
          <h2
            id="kategori"
            className="text-2xl font-bold text-ink-900 lg:text-[28px]"
          >
            Mulai dari alat yang kamu butuhkan
          </h2>
          <Button asChild variant="ghost" className="h-10 px-3 font-semibold">
            <Link href="/produk">Semua kategori</Link>
          </Button>
        </div>
        <Suspense fallback={<CategoryStripSkeleton />}>
          <CategoryStrip />
        </Suspense>
      </SectionShell>

      <div className="bg-surface">
        <SectionShell
          className="flex flex-col gap-8 pt-12 pb-20 lg:pt-16 lg:pb-28"
          aria-labelledby="terbaru"
        >
          <div className="flex items-end justify-between gap-4">
            <h2
              id="terbaru"
              className="text-2xl font-bold tracking-tight text-ink-900 lg:text-[28px]"
            >
              Baru datang, langsung siap kerja
            </h2>
            <Button
              asChild
              variant="ghost"
              className="h-10 px-3 font-semibold text-brand-700"
            >
              <Link href="/produk">Lihat semua produk</Link>
            </Button>
          </div>
          <Suspense fallback={<LatestProductsSkeleton />}>
            <LatestProductsGrid />
          </Suspense>
        </SectionShell>
      </div>

      <VisitStore>
        <Suspense fallback={<VisitStoreSkeleton />}>
          <VisitStoreDetails />
        </Suspense>
      </VisitStore>

      <Faq />
    </div>
  );
}



