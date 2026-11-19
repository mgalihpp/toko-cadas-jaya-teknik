"use client";

import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CatalogFilters } from "../schemas";
import type { CategoryWithCount, Condition } from "../types";

type FiltersProps = {
  filters: CatalogFilters;
  categories: CategoryWithCount[];
  onChange: (changes: Partial<CatalogFilters>) => void;
  className?: string;
};

const CONDITION_OPTIONS: { value: Condition | undefined; label: string }[] = [
  { value: undefined, label: "Semua" },
  { value: "baru", label: "Baru" },
  { value: "bekas", label: "Bekas" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={title} className="flex flex-col gap-3.5 border-b border-ink-200 py-5 first:pt-0">
      <h2 className="font-sans text-sm font-semibold text-ink-900">{title}</h2>
      {children}
    </div>
  );
}

function OptionRow({
  selected,
  shape,
  label,
  count,
  onSelect,
}: {
  selected: boolean;
  shape: "radio" | "checkbox";
  label: string;
  count?: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role={shape}
      aria-checked={selected}
      onClick={onSelect}
      className="group flex w-full items-center gap-2.5 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span
        aria-hidden
        className={cn(
          "flex size-[18px] shrink-0 items-center justify-center border transition-colors",
          shape === "radio" ? "rounded-full" : "rounded-[5px]",
          selected
            ? "border-brand-600 bg-brand-600 text-white"
            : "border-ink-300 bg-white group-hover:border-ink-500"
        )}
      >
        {selected ? (
          shape === "radio" ? (
            <span className="size-1.5 rounded-full bg-white" />
          ) : (
            <CheckIcon className="size-3" strokeWidth={3} />
          )
        ) : null}
      </span>
      <span
        className={cn(
          "flex-1 text-sm",
          selected ? "font-medium text-ink-900" : "text-ink-600 group-hover:text-ink-900"
        )}
      >
        {label}
      </span>
      {count !== undefined ? <span className="text-xs text-ink-500">{count}</span> : null}
    </button>
  );
}

const digitsOnly = (value: string) => value.replace(/\D/g, "").slice(0, 12);
const groupDigits = (value: string) =>
  value ? new Intl.NumberFormat("id-ID").format(Number(value)) : "";
const toText = (value: number | undefined) => (value === undefined ? "" : String(value));

function PriceRange({
  minPrice,
  maxPrice,
  onApply,
}: {
  minPrice?: number;
  maxPrice?: number;
  onApply: (min?: number, max?: number) => void;
}) {
  const [min, setMin] = useState(toText(minPrice));
  const [max, setMax] = useState(toText(maxPrice));
  const [synced, setSynced] = useState({ minPrice, maxPrice });
  if (synced.minPrice !== minPrice || synced.maxPrice !== maxPrice) {
    setSynced({ minPrice, maxPrice });
    setMin(toText(minPrice));
    setMax(toText(maxPrice));
  }

  const minValue = min ? Number(min) : undefined;
  const maxValue = max ? Number(max) : undefined;
  const invalid = minValue !== undefined && maxValue !== undefined && minValue > maxValue;
  const changed = minValue !== minPrice || maxValue !== maxPrice;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!invalid) onApply(minValue, maxValue);
      }}
    >
      <div className="flex items-center gap-2">
        {[
          { label: "Harga minimum", value: min, set: setMin, placeholder: "Min" },
          { label: "Harga maksimum", value: max, set: setMax, placeholder: "Maks" },
        ].map((field) => (
          <label
            key={field.label}
            className="flex h-10 min-w-0 flex-1 items-center gap-1 rounded-lg border border-ink-300 bg-white px-2.5 text-[13px] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
          >
            <span className="text-ink-500">Rp</span>
            <input
              aria-label={field.label}
              inputMode="numeric"
              placeholder={field.placeholder}
              value={groupDigits(field.value)}
              onChange={(event) => field.set(digitsOnly(event.target.value))}
              className="w-full min-w-0 bg-transparent text-ink-900 outline-none placeholder:text-ink-500"
            />
          </label>
        ))}
      </div>
      {invalid ? (
        <p className="text-xs text-error">Harga minimum lebih besar dari maksimum.</p>
      ) : null}
      <Button
        type="submit"
        variant="outline"
        className="h-9 border-ink-300 font-semibold"
        disabled={invalid || !changed}
      >
        Terapkan harga
      </Button>
    </form>
  );
}

export function CatalogFilterPanel({ filters, categories, onChange, className }: FiltersProps) {
  const total = categories.reduce((sum, c) => sum + Number(c.productCount), 0);
  return (
    <div className={cn("flex flex-col", className)}>
      <Section title="Kondisi">
        {CONDITION_OPTIONS.map((option) => (
          <OptionRow
            key={option.label}
            shape="radio"
            label={option.label}
            count={option.value === undefined ? total : undefined}
            selected={filters.condition === option.value}
            onSelect={() => onChange({ condition: option.value })}
          />
        ))}
      </Section>
      {categories.length > 0 ? (
        <Section title="Kategori">
          {categories.map((category) => {
            const selected = filters.categorySlug === category.slug;
            return (
              <OptionRow
                key={category.id}
                shape="checkbox"
                label={category.name}
                count={Number(category.productCount)}
                selected={selected}
                onSelect={() => onChange({ categorySlug: selected ? undefined : category.slug })}
              />
            );
          })}
        </Section>
      ) : null}
      <Section title="Rentang harga">
        <PriceRange
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onApply={(minPrice, maxPrice) => onChange({ minPrice, maxPrice })}
        />
      </Section>
    </div>
  );
}
