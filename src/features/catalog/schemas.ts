import { z } from "zod";

export const SORT_OPTIONS = [
  { value: "terbaru", label: "Terbaru" },
  { value: "termurah", label: "Harga terendah" },
  { value: "termahal", label: "Harga tertinggi" },
] as const;

export type CatalogSort = (typeof SORT_OPTIONS)[number]["value"];

export const CATALOG_PAGE_SIZE = 20;

export type CatalogFilters = {
  q?: string;
  categorySlug?: string;
  condition?: "baru" | "bekas";
  minPrice?: number;
  maxPrice?: number;
  sort: CatalogSort;
  page: number;
};

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);
const text = z.preprocess(first, z.string().trim().min(1).max(100).optional().catch(undefined));
const price = z.preprocess(
  (v) => {
    const raw = first(v);
    if (typeof raw !== "string" || raw.trim() === "") return undefined;
    return Number(raw.replace(/\D/g, ""));
  },
  z.number().int().min(0).optional().catch(undefined)
);

const searchParamsSchema = z.object({
  q: text,
  kategori: text,
  kondisi: z.preprocess(first, z.enum(["baru", "bekas"]).optional().catch(undefined)),
  min: price,
  max: price,
  urut: z.preprocess(
    first,
    z.enum(["terbaru", "termurah", "termahal"]).catch("terbaru")
  ),
  hal: z.preprocess(
    (v) => Number(first(v) ?? 1),
    z.number().int().min(1).max(10_000).catch(1)
  ),
});

type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseCatalogSearchParams(params: RawSearchParams): CatalogFilters {
  const p = searchParamsSchema.parse({
    ...params,
    kondisi: params.kondisi ?? params.condition,
    kategori: params.kategori ?? params.category,
  });
  return {
    q: p.q,
    categorySlug: p.kategori,
    condition: p.kondisi,
    minPrice: p.min,
    maxPrice: p.max,
    sort: p.urut,
    page: p.hal,
  };
}

export function catalogHref(filters: Partial<CatalogFilters>): string {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.categorySlug) sp.set("kategori", filters.categorySlug);
  if (filters.condition) sp.set("kondisi", filters.condition);
  if (filters.minPrice !== undefined) sp.set("min", String(filters.minPrice));
  if (filters.maxPrice !== undefined) sp.set("max", String(filters.maxPrice));
  if (filters.sort && filters.sort !== "terbaru") sp.set("urut", filters.sort);
  if (filters.page && filters.page > 1) sp.set("hal", String(filters.page));
  const query = sp.toString();
  return query ? `/produk?${query}` : "/produk";
}

export function hasActiveFilters(filters: CatalogFilters): boolean {
  return Boolean(
    filters.q ||
      filters.categorySlug ||
      filters.condition ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined
  );
}

export function toProductListInput(filters: CatalogFilters) {
  return { ...filters, pageSize: CATALOG_PAGE_SIZE };
}

export const RELATED_LIMIT = 4;

export function relatedProductsInput(categorySlug: string) {
  return { categorySlug, pageSize: RELATED_LIMIT + 1 };
}
