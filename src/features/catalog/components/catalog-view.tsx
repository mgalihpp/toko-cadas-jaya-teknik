"use client";

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDownUpIcon, ChevronDownIcon, RefreshCwIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MButton } from "@/components/mobile/m-button";
import { TopBar } from "@/components/mobile/top-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { useCatalogNavigation } from "../hooks/use-catalog-navigation";
import {
  CATALOG_PAGE_SIZE,
  hasActiveFilters,
  SORT_OPTIONS,
  toProductListInput,
  type CatalogFilters,
  type CatalogSort,
} from "../schemas";
import type { ProductSummary } from "../types";
import { CatalogFilterSheet } from "./catalog-filter-sheet";
import { CatalogSearch } from "./catalog-search";
import { ProductCard } from "./product-card";
import { ProductCardSkeleton } from "./skeletons";

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-[34px] shrink-0 items-center rounded-[17px] border-[1.5px] px-3.5 text-[13px] font-bold whitespace-nowrap",
        active ? "border-brand-600 bg-brand-600 text-white" : "border-ink-200 bg-white text-ink-900",
      )}
    >
      {children}
    </button>
  );
}

function emptyDescription(filters: CatalogFilters) {
  const parts: string[] = [];
  if (filters.condition) parts.push(`filter ${filters.condition === "baru" ? "Baru" : "Bekas"}`);
  if (filters.maxPrice !== undefined) parts.push(`harga di bawah ${formatRupiah(filters.maxPrice)}`);
  else if (filters.minPrice !== undefined) parts.push(`harga mulai ${formatRupiah(filters.minPrice)}`);
  if (filters.inStock) parts.push("stok tersedia");
  const target = filters.q ? `Tidak ada hasil untuk "${filters.q}"` : "Tidak ada hasil";
  const withFilters = parts.length > 0 ? ` dengan ${parts.join(" dan ")}` : "";
  return `${target}${withFilters}. Coba kata kunci lain atau longgarkan filter.`;
}

function MoreProducts({
  filters,
  firstPageCount,
  total,
}: {
  filters: CatalogFilters;
  firstPageCount: number;
  total: number;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<ProductSummary[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const loaded = firstPageCount + items.length;
  const done = loaded >= total;

  useEffect(() => {
    const node = sentinel.current;
    if (!node || done) return;
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting || loading) return;
        setLoading(true);
        try {
          const next = await queryClient.fetchQuery(
            trpc.catalog.products.queryOptions({ ...toProductListInput(filters), page: page + 1 })
          );
          setItems((prev) => [...prev, ...next.items]);
          setPage(page + 1);
        } finally {
          setLoading(false);
        }
      },
      { rootMargin: "240px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [done, loading, page, filters, queryClient, trpc]);

  return (
    <>
      {items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
      {done ? null : (
        <div ref={sentinel} className="col-span-2 grid grid-cols-2 gap-2.5">
          {loading ? (
            <>
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </>
          ) : null}
        </div>
      )}
    </>
  );
}

export function CatalogView({ filters }: { filters: CatalogFilters }) {
  const trpc = useTRPC();
  const { data: list } = useSuspenseQuery(
    trpc.catalog.products.queryOptions(toProductListInput(filters))
  );
  const { data: categories } = useSuspenseQuery(trpc.catalog.categories.queryOptions());
  const { update, reset, isPending } = useCatalogNavigation(filters);
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = hasActiveFilters(filters);
  const activeCount = [
    filters.categorySlug,
    filters.condition,
    filters.minPrice !== undefined || filters.maxPrice !== undefined ? "harga" : undefined,
    filters.inStock ? "stok" : undefined,
  ].filter(Boolean).length;
  const sortLabel = SORT_OPTIONS.find((o) => o.value === filters.sort)?.label ?? "Terbaru";
  const allActive = !filters.condition && !filters.categorySlug;
  const queryKey = JSON.stringify({ ...filters, page: 1 });

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Katalog produk" backHref="/" />
      <div className="flex flex-col gap-2.5 border-b border-ink-200 bg-white px-3 py-2.5">
        <div className="flex items-center gap-2">
          <CatalogSearch value={filters.q ?? ""} onSearch={(q) => update({ q })} className="flex-1" />
          <button
            type="button"
            aria-label="Filter"
            onClick={() => setFilterOpen(true)}
            className="relative flex size-11 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-brand-600 text-brand-600"
          >
            <SlidersHorizontalIcon className="size-[22px]" strokeWidth={2} />
            {activeCount > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 flex size-[18px] items-center justify-center rounded-full bg-accent-yellow text-[11px] font-bold text-ink-900">
                {activeCount}
              </span>
            ) : null}
          </button>
        </div>
        <div className="cjt-no-scrollbar flex gap-2 overflow-x-auto">
          <FilterChip active={allActive} onClick={() => update({ condition: undefined, categorySlug: undefined })}>
            Semua
          </FilterChip>
          <FilterChip
            active={filters.condition === "baru"}
            onClick={() => update({ condition: filters.condition === "baru" ? undefined : "baru" })}
          >
            Baru
          </FilterChip>
          <FilterChip
            active={filters.condition === "bekas"}
            onClick={() => update({ condition: filters.condition === "bekas" ? undefined : "bekas" })}
          >
            Bekas
          </FilterChip>
          {categories.map((category) => (
            <FilterChip
              key={category.id}
              active={filters.categorySlug === category.slug}
              onClick={() =>
                update({ categorySlug: filters.categorySlug === category.slug ? undefined : category.slug })
              }
            >
              {category.name}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 pt-2.5">
        <p className="flex-1 text-[13px] font-medium text-ink-500" aria-live="polite">
          {list.total} produk ditemukan
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="flex items-center gap-1 text-[13px] font-bold text-brand-700">
              <ArrowDownUpIcon className="size-4" />
              {sortLabel}
              <ChevronDownIcon className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={filters.sort}
              onValueChange={(value) => update({ sort: value as CatalogSort })}
            >
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {list.items.length === 0 ? (
        <div className="flex flex-col items-center gap-2.5 px-6 py-14 text-center">
          <span className="flex size-24 items-center justify-center rounded-full bg-brand-100">
            <SearchIcon className="size-11 text-brand-600" strokeWidth={1.6} />
          </span>
          <h2 className="text-lg font-bold text-ink-900">
            {filtered ? "Produk tidak ditemukan" : "Belum ada produk"}
          </h2>
          <p className="max-w-[290px] text-sm text-ink-500">
            {filtered
              ? emptyDescription(filters)
              : "Produk akan tampil di sini setelah ditambahkan oleh toko."}
          </p>
          {filtered ? (
            <div className="mt-1.5 flex flex-col items-center gap-2.5">
              <MButton size="sm" className="h-[46px] px-6" onClick={reset}>
                <RefreshCwIcon className="size-[18px]" />
                Reset filter
              </MButton>
              <MButton
                variant="secondary"
                className="h-[46px] px-6"
                onClick={() => update({ q: undefined, condition: undefined, categorySlug: undefined })}
              >
                Lihat semua produk
              </MButton>
            </div>
          ) : null}
        </div>
      ) : (
        <div
          className={cn(
            "grid grid-cols-2 gap-2.5 px-3 py-2.5 transition-opacity",
            isPending && "pointer-events-none opacity-60",
          )}
          aria-busy={isPending}
        >
          {list.items.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 4} />
          ))}
          {list.total > CATALOG_PAGE_SIZE ? (
            <MoreProducts
              key={queryKey}
              filters={filters}
              firstPageCount={list.items.length}
              total={list.total}
            />
          ) : null}
        </div>
      )}

      <CatalogFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        categories={categories}
        onApply={(draft) => update(draft)}
      />
    </div>
  );
}
