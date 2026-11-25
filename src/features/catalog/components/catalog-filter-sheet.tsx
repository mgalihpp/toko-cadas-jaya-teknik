"use client";

import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { CheckIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { MButton } from "@/components/mobile/m-button";
import { BottomSheet, SheetClose, SheetRoot } from "@/components/mobile/sheet";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { toProductListInput, type CatalogFilters } from "../schemas";
import type { CategoryWithCount } from "../types";

type Draft = Pick<CatalogFilters, "condition" | "categorySlug" | "minPrice" | "maxPrice" | "inStock">;

const STEP = 10_000;

function Chip({
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
        "inline-flex h-[38px] items-center rounded-[19px] border-[1.5px] px-3.5 text-sm",
        active
          ? "border-brand-600 bg-brand-100 font-bold text-brand-700"
          : "border-ink-200 bg-white font-medium text-ink-900",
      )}
    >
      {children}
    </button>
  );
}

function PriceInput({ value, label }: { value: number; label: string }) {
  return (
    <div
      aria-label={label}
      className="flex h-11 flex-1 items-center rounded-[10px] border-[1.5px] border-ink-200 px-3 text-sm text-ink-900"
    >
      {formatRupiah(value)}
    </div>
  );
}

export function CatalogFilterSheet({
  open,
  onOpenChange,
  filters,
  categories,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: CatalogFilters;
  categories: CategoryWithCount[];
  onApply: (draft: Draft) => void;
}) {
  const trpc = useTRPC();
  const { data: bounds } = useSuspenseQuery(trpc.catalog.priceRange.queryOptions());
  const lo = Math.floor(bounds.min / STEP) * STEP;
  const hi = Math.max(Math.ceil(bounds.max / STEP) * STEP, lo + STEP);

  const initial = (): Draft => ({
    condition: filters.condition,
    categorySlug: filters.categorySlug,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    inStock: filters.inStock,
  });
  const [draft, setDraft] = useState<Draft>(initial);
  const [seen, setSeen] = useState(open);
  if (open !== seen) {
    setSeen(open);
    if (open) setDraft(initial());
  }

  const { data: preview } = useQuery(
    trpc.catalog.products.queryOptions(
      { ...toProductListInput({ ...filters, ...draft, page: 1 }), pageSize: 1 },
      { enabled: open, placeholderData: (prev) => prev }
    )
  );
  const min = draft.minPrice ?? lo;
  const max = draft.maxPrice ?? hi;
  const pct = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const setMin = (v: number) =>
    setDraft((d) => ({ ...d, minPrice: v <= lo ? undefined : Math.min(v, max - STEP) }));
  const setMax = (v: number) =>
    setDraft((d) => ({ ...d, maxPrice: v >= hi ? undefined : Math.max(v, min + STEP) }));
  const priceActive = draft.minPrice !== undefined || draft.maxPrice !== undefined;

  return (
    <SheetRoot open={open} onOpenChange={onOpenChange}>
      <BottomSheet title="Filter produk" className="h-[600px] max-h-[88svh]">
        <div className="flex h-12 items-center gap-1 pr-2 pl-4">
          <p className="flex-1 text-[17px] font-bold text-ink-900">Filter produk</p>
          <SheetClose
            aria-label="Tutup"
            className="flex size-10 items-center justify-center rounded-full text-ink-500"
          >
            <XIcon className="size-6" strokeWidth={1.8} />
          </SheetClose>
        </div>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-1">
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-ink-900">Kondisi</h3>
            <div className="flex flex-wrap gap-2">
              <Chip active={!draft.condition} onClick={() => setDraft((d) => ({ ...d, condition: undefined }))}>
                Semua
              </Chip>
              <Chip active={draft.condition === "baru"} onClick={() => setDraft((d) => ({ ...d, condition: "baru" }))}>
                Baru
              </Chip>
              <Chip active={draft.condition === "bekas"} onClick={() => setDraft((d) => ({ ...d, condition: "bekas" }))}>
                Bekas
              </Chip>
            </div>
          </section>

          {categories.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-bold text-ink-900">Kategori</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    active={draft.categorySlug === category.slug}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        categorySlug: d.categorySlug === category.slug ? undefined : category.slug,
                      }))
                    }
                  >
                    {category.name}
                  </Chip>
                ))}
              </div>
            </section>
          ) : null}

          <section className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h3 className="flex-1 text-sm font-bold text-ink-900">Rentang harga</h3>
              {priceActive ? (
                <p className="text-[13px] font-bold text-brand-700">
                  {formatRupiah(min)} – {formatRupiah(max)}
                </p>
              ) : null}
            </div>
            <div className="relative mx-2 mt-1 h-7">
              <span className="absolute inset-x-0 top-3 h-1 rounded-sm bg-ink-200" />
              <span
                className="absolute top-3 h-1 rounded-sm bg-brand-600"
                style={{ left: `${pct(min)}%`, right: `${100 - pct(max)}%` }}
              />
              <input
                type="range"
                aria-label="Harga minimum"
                className="cjt-range"
                min={lo}
                max={hi}
                step={STEP}
                value={min}
                onChange={(e) => setMin(Number(e.target.value))}
              />
              <input
                type="range"
                aria-label="Harga maksimum"
                className="cjt-range"
                min={lo}
                max={hi}
                step={STEP}
                value={max}
                onChange={(e) => setMax(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-2">
              <PriceInput value={min} label="Harga minimum" />
              <span className="text-sm text-ink-500">–</span>
              <PriceInput value={max} label="Harga maksimum" />
            </div>
          </section>

          <button
            type="button"
            role="switch"
            aria-checked={Boolean(draft.inStock)}
            onClick={() => setDraft((d) => ({ ...d, inStock: d.inStock ? undefined : true }))}
            className="flex items-center gap-2 py-1 text-left"
          >
            <CheckIcon className="size-5 text-success" strokeWidth={2.2} />
            <span className="flex-1 text-sm font-medium text-ink-900">Hanya yang stoknya tersedia</span>
            <span
              className={cn(
                "relative h-[26px] w-11 rounded-full transition-colors",
                draft.inStock ? "bg-brand-600" : "bg-ink-300",
              )}
            >
              <span
                className={cn(
                  "absolute top-[3px] size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.3)] transition-all",
                  draft.inStock ? "left-[21px]" : "left-[3px]",
                )}
              />
            </span>
          </button>
        </div>
        <div className="flex gap-2.5 border-t border-ink-200 px-4 pt-2.5 pb-[18px]">
          <MButton
            variant="outline"
            className="w-[110px]"
            onClick={() =>
              setDraft({ condition: undefined, categorySlug: undefined, minPrice: undefined, maxPrice: undefined, inStock: undefined })
            }
          >
            Reset
          </MButton>
          <MButton
            block
            onClick={() => {
              onApply(draft);
              onOpenChange(false);
            }}
          >
            Tampilkan {preview?.total ?? ""} produk
          </MButton>
        </div>
      </BottomSheet>
    </SheetRoot>
  );
}
