"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRightIcon, EyeIcon, EyeOffIcon, PackageIcon, PencilIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AdminHeader, AdminHeaderAction } from "@/components/layout";
import { MLink } from "@/components/mobile/m-button";
import { StickyBar } from "@/components/mobile/sticky-bar";
import { SwipeRow } from "@/components/mobile/swipe-row";
import { EmptyState, ErrorState } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductBadge } from "@/features/catalog";
import { ProductThumb } from "@/features/cart";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "../hooks/use-debounced-value";
import { useTRPC } from "@/trpc/client";
import { useSetProductActive } from "../hooks/use-product-mutations";

type Filter = "semua" | "aktif" | "nonaktif" | "menipis" | "bekas";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "aktif", label: "Aktif" },
  { value: "nonaktif", label: "Nonaktif" },
  { value: "menipis", label: "Stok menipis" },
  { value: "bekas", label: "Bekas" },
];

const FILTER_INPUT = {
  semua: {},
  aktif: { isActive: true },
  nonaktif: { isActive: false },
  menipis: { lowStock: true },
  bekas: { condition: "bekas" as const },
} satisfies Record<Filter, object>;

export function ProductList() {
  const trpc = useTRPC();
  const [filter, setFilter] = useState<Filter>("semua");
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");
  const search = useDebouncedValue(q.trim());
  const setActive = useSetProductActive();

  const products = useQuery(
    trpc.admin.products.list.queryOptions({ ...FILTER_INPUT[filter], q: search || undefined, pageSize: 100 }),
  );
  const counts = {
    semua: useQuery(trpc.admin.products.list.queryOptions({ ...FILTER_INPUT.semua, pageSize: 1 })).data?.total,
    aktif: useQuery(trpc.admin.products.list.queryOptions({ ...FILTER_INPUT.aktif, pageSize: 1 })).data?.total,
    nonaktif: useQuery(trpc.admin.products.list.queryOptions({ ...FILTER_INPUT.nonaktif, pageSize: 1 })).data?.total,
    menipis: useQuery(trpc.admin.products.list.queryOptions({ ...FILTER_INPUT.menipis, pageSize: 1 })).data?.total,
    bekas: useQuery(trpc.admin.products.list.queryOptions({ ...FILTER_INPUT.bekas, pageSize: 1 })).data?.total,
  };

  return (
    <div className="flex flex-1 flex-col pb-[76px]">
      <AdminHeader
        title="Produk"
        right={
          <AdminHeaderAction
            label={searching ? "Tutup pencarian" : "Cari"}
            onClick={() => {
              if (searching) setQ("");
              setSearching((s) => !s);
            }}
          >
            {searching ? <XIcon className="size-6" strokeWidth={1.8} /> : <SearchIcon className="size-6" strokeWidth={1.8} />}
          </AdminHeaderAction>
        }
      />
      {searching ? (
        <div className="border-b border-ink-200 bg-white px-3 py-2">
          <div className="flex h-11 items-center gap-2 rounded-[10px] bg-ink-50 px-3">
            <SearchIcon className="size-5 text-brand-600" strokeWidth={2} />
            <input
              autoFocus
              type="search"
              aria-label="Cari produk"
              placeholder="Cari nama atau SKU"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-500"
            />
          </div>
        </div>
      ) : null}
      <div className="cjt-no-scrollbar flex gap-2 overflow-x-auto border-b border-ink-200 bg-white px-3 py-2.5">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f.value)}
              className={cn(
                "inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-[17px] border-[1.5px] px-3.5 text-[13px] font-bold whitespace-nowrap",
                active ? "border-brand-600 bg-brand-600 text-white" : "border-ink-200 bg-white text-ink-900",
              )}
            >
              {f.label}
              {counts[f.value] !== undefined ? <span className="font-medium opacity-80">{counts[f.value]}</span> : null}
            </button>
          );
        })}
      </div>

      {products.isPending ? (
        <ListSkeleton />
      ) : products.isError ? (
        <ErrorState description={products.error.message} onRetry={() => products.refetch()} />
      ) : products.data.items.length === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title={search || filter !== "semua" ? "Produk tidak ditemukan" : "Belum ada produk"}
          description={
            search || filter !== "semua"
              ? "Coba ubah kata kunci atau filter."
              : "Tambahkan produk pertama untuk ditampilkan di katalog."
          }
        />
      ) : (
        <ul>
          {products.data.items.map((p) => (
            <li key={p.id} className="border-b border-ink-200 bg-white">
              <SwipeRow
                actionWidth={168}
                actions={
                  <>
                    <Link
                      href={`/admin/produk/${p.id}`}
                      className="flex flex-1 flex-col items-center justify-center gap-1 bg-brand-600 text-xs font-bold text-white"
                    >
                      <PencilIcon className="size-5" />
                      Ubah
                    </Link>
                    <button
                      type="button"
                      disabled={setActive.isPending}
                      onClick={() => setActive.mutate({ id: p.id, isActive: !p.isActive })}
                      className="flex flex-1 flex-col items-center justify-center gap-1 bg-warning text-xs font-bold text-white"
                    >
                      {p.isActive ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
                      {p.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </>
                }
              >
                <Link href={`/admin/produk/${p.id}`} className="flex items-center gap-3 p-3">
                  <ProductThumb src={p.thumbnailUrl} alt="" className="size-[60px] rounded-[10px]" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="line-clamp-2 text-sm font-medium text-ink-900">{p.name}</p>
                    <div className="flex items-center gap-1.5">
                      <ProductBadge kind={p.condition} />
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-[3px] text-[11px] leading-[1.2] font-bold",
                          p.isActive ? "bg-success-soft text-success" : "bg-ink-100 text-ink-500",
                        )}
                      >
                        {p.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                      <span className={cn("text-xs font-medium", p.condition === "bekas" ? "text-warning" : "text-ink-500")}>
                        {p.condition === "bekas" ? `Sisa ${p.available} unit` : `Stok ${p.available}`}
                      </span>
                    </div>
                    <p className="text-[15px] font-bold text-brand-700">{formatRupiah(p.price)}</p>
                  </div>
                  <ChevronRightIcon className="size-[18px] shrink-0 text-ink-500" />
                </Link>
              </SwipeRow>
            </li>
          ))}
        </ul>
      )}

      <StickyBar className="bottom-[68px]">
        <MLink href="/admin/produk/baru" size="lg" block>
          <PlusIcon className="size-[18px]" />
          Tambah produk
        </MLink>
      </StickyBar>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div role="status" className="flex flex-col">
      <span className="sr-only">Memuat produk</span>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 border-b border-ink-200 bg-white p-3">
          <Skeleton className="size-[60px] rounded-[10px]" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
