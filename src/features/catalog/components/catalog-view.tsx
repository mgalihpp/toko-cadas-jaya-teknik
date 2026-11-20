"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronRightIcon, SearchXIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { useCatalogNavigation } from "../hooks/use-catalog-navigation";
import {
  catalogHref,
  hasActiveFilters,
  SORT_OPTIONS,
  toProductListInput,
  type CatalogFilters,
  type CatalogSort,
} from "../schemas";
import { CatalogFilterPanel } from "./catalog-filters";
import { CatalogPagination } from "./catalog-pagination";
import { CatalogSearch } from "./catalog-search";
import { CONTAINER } from "./container";
import { ProductCard } from "./product-card";

function ActiveFilterChips({
  filters,
  categoryName,
  onChange,
  onReset,
}: {
  filters: CatalogFilters;
  categoryName?: string;
  onChange: (changes: Partial<CatalogFilters>) => void;
  onReset: () => void;
}) {
  const chips: { key: string; label: string; clear: Partial<CatalogFilters> }[] = [];
  if (filters.q) chips.push({ key: "q", label: `"${filters.q}"`, clear: { q: undefined } });
  if (filters.categorySlug)
    chips.push({
      key: "kategori",
      label: categoryName ?? filters.categorySlug,
      clear: { categorySlug: undefined },
    });
  if (filters.condition)
    chips.push({
      key: "kondisi",
      label: filters.condition === "baru" ? "Baru" : "Bekas",
      clear: { condition: undefined },
    });
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const min = filters.minPrice !== undefined ? formatRupiah(filters.minPrice) : "Rp 0";
    const max = filters.maxPrice !== undefined ? formatRupiah(filters.maxPrice) : "tanpa batas";
    chips.push({
      key: "harga",
      label: `${min} sampai ${max}`,
      clear: { minPrice: undefined, maxPrice: undefined },
    });
  }
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChange(chip.clear)}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
        >
          {chip.label}
          <XIcon className="size-3.5" aria-label="Hapus filter" />
        </button>
      ))}
      <button
        type="button"
        onClick={onReset}
        className="text-xs font-medium text-ink-600 underline-offset-4 hover:text-ink-900 hover:underline"
      >
        Hapus semua
      </button>
    </div>
  );
}

export function CatalogView({ filters }: { filters: CatalogFilters }) {
  const trpc = useTRPC();
  const { data: list } = useSuspenseQuery(
    trpc.catalog.products.queryOptions(toProductListInput(filters))
  );
  const { data: categories } = useSuspenseQuery(trpc.catalog.categories.queryOptions());
  const { update, reset, isPending } = useCatalogNavigation(filters);

  const activeCategory = categories.find((c) => c.slug === filters.categorySlug);
  const filtered = hasActiveFilters(filters);
  const activeCount = [
    filters.categorySlug,
    filters.condition,
    filters.minPrice !== undefined || filters.maxPrice !== undefined ? "harga" : undefined,
  ].filter(Boolean).length;
  const shown = list.items.length;
  const title = activeCategory?.name ?? (filters.condition === "bekas" ? "Barang Bekas" : "Katalog Produk");

  return (
    <div className="flex flex-col">
      <header className={cn(CONTAINER, "flex flex-col gap-2.5 pt-8 pb-6 lg:pt-10 lg:pb-8")}>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px]">
          <Link href="/" className="text-ink-500 hover:text-ink-900">
            Beranda
          </Link>
          <ChevronRightIcon className="size-3.5 text-ink-300" />
          <span className="font-semibold text-ink-900">Produk</span>
        </nav>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl lg:text-[44px]">
            {title}
          </h1>
          <p className="text-sm text-ink-500" aria-live="polite">
            {list.total === 0
              ? "Tidak ada produk"
              : `Menampilkan ${shown} dari ${list.total} produk`}
          </p>
        </div>
      </header>

      <div className={cn(CONTAINER, "flex gap-12 pb-24")}>
        <aside className="hidden w-[260px] shrink-0 lg:block" aria-label="Filter produk">
          <CatalogFilterPanel filters={filters} categories={categories} onChange={update} />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-6" aria-label="Daftar produk">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CatalogSearch
              value={filters.q ?? ""}
              onSearch={(q) => update({ q })}
              className="w-full sm:max-w-[420px]"
            />
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-[42px] flex-1 border-ink-300 px-4 font-semibold lg:hidden"
                  >
                    <SlidersHorizontalIcon />
                    Filter
                    {activeCount > 0 ? (
                      <span className="flex size-5 items-center justify-center rounded-full bg-brand-600 text-[11px] text-white">
                        {activeCount}
                      </span>
                    ) : null}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[320px] max-w-[85vw] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filter produk</SheetTitle>
                    <SheetDescription>Saring berdasarkan kondisi, kategori, dan harga.</SheetDescription>
                  </SheetHeader>
                  <CatalogFilterPanel
                    filters={filters}
                    categories={categories}
                    onChange={update}
                    className="px-4 pb-6"
                  />
                </SheetContent>
              </Sheet>
              <Select
                value={filters.sort}
                onValueChange={(value) => update({ sort: value as CatalogSort })}
              >
                <SelectTrigger
                  aria-label="Urutkan"
                  className="h-[42px]! flex-1 gap-2 border-ink-300 px-3 text-[13px] sm:flex-none"
                >
                  <span className="text-ink-500">Urutkan:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ActiveFilterChips
            filters={filters}
            categoryName={activeCategory?.name}
            onChange={update}
            onReset={reset}
          />

          {list.items.length === 0 ? (
            <EmptyState
              icon={SearchXIcon}
              className="min-h-[360px] rounded-2xl"
              title={
                filters.q
                  ? `Tidak ada yang cocok dengan "${filters.q}"`
                  : filtered
                    ? "Tidak ada produk yang cocok"
                    : "Belum ada produk"
              }
              description={
                filtered
                  ? "Coba kata lain atau hapus beberapa filter."
                  : "Produk akan tampil di sini setelah ditambahkan oleh toko."
              }
              action={
                filtered ? (
                  <Button variant="outline" className="h-10 border-ink-300 px-4 font-semibold" onClick={reset}>
                    Hapus semua filter
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div
              className={cn(
                "grid grid-cols-2 gap-x-4 gap-y-8 transition-opacity sm:gap-x-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
                isPending && "pointer-events-none opacity-60"
              )}
              aria-busy={isPending}
            >
              {list.items.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 5} />
              ))}
            </div>
          )}

          <CatalogPagination
            page={list.page}
            pageCount={list.pageCount}
            hrefFor={(page) => catalogHref({ ...filters, page })}
          />
        </section>
      </div>
    </div>
  );
}
