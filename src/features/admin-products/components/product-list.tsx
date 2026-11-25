"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleXIcon,
  DownloadIcon,
  EllipsisIcon,
  PackageIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { downloadCsv } from "../csv";
import { useDebouncedValue } from "../hooks/use-debounced-value";
import { useSetProductActive } from "../hooks/use-product-mutations";
import { monoFont, outlineButton, primaryButton, rowSwitch } from "../styles";
import { AdminConditionBadge } from "./condition-badge";
import { DeleteProductDialog } from "./delete-product-dialog";

const PAGE_SIZE = 20;
const LOW_STOCK = 2;
const STATUS_LABEL = { semua: "Status", aktif: "Aktif", nonaktif: "Nonaktif" } as const;
type StatusFilter = keyof typeof STATUS_LABEL;
const CONDITION_OPTIONS = [
  ["semua", "Semua"],
  ["baru", "Baru"],
  ["bekas", "Bekas"],
] as const;
type ConditionFilter = (typeof CONDITION_OPTIONS)[number][0];

const COLUMNS = [
  { width: 44 },
  { label: "Produk" },
  { label: "Kategori", width: 146 },
  { label: "Kondisi", width: 106 },
  { label: "Harga", width: 146, right: true },
  { label: "Stok", width: 126, right: true },
  { label: "Status", width: 106 },
  { width: 84 },
] as const;

const cell = "px-2 first:pl-5 last:pr-5";
const filterButton =
  "flex h-[38px] items-center gap-2 rounded-md border border-ink-300 bg-white px-3 text-[13px]/4 font-medium text-ink-900 outline-none hover:bg-ink-50 focus-visible:ring-3 focus-visible:ring-ring/50";
const pagerButton =
  "h-[30px] gap-2 rounded-md border-ink-300 bg-white px-3 text-[13px]/4 font-semibold text-ink-900 hover:bg-ink-50";

export function ProductList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<StatusFilter>("semua");
  const [condition, setCondition] = useState<ConditionFilter>("semua");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; name: string; isActive: boolean } | null>(null);
  const search = useDebouncedValue(q.trim());

  const filters = {
    q: search || undefined,
    categoryId: categoryId || undefined,
    isActive: status === "semua" ? undefined : status === "aktif",
    condition: condition === "semua" ? undefined : condition,
  };
  const categories = useQuery(trpc.admin.categories.list.queryOptions());
  const products = useQuery(
    trpc.admin.products.list.queryOptions(
      { ...filters, page, pageSize: PAGE_SIZE },
      { placeholderData: keepPreviousData }
    )
  );
  const allCount = useQuery(trpc.admin.products.list.queryOptions({ pageSize: 1 }));
  const activeCount = useQuery(trpc.admin.products.list.queryOptions({ isActive: true, pageSize: 1 }));
  const setActive = useSetProductActive();

  const data = products.data;
  const filtered = Boolean(search || categoryId || status !== "semua" || condition !== "semua");
  const from = data ? (data.page - 1) * PAGE_SIZE + 1 : 0;
  const to = data ? from + data.items.length - 1 : 0;
  const pageIds = data?.items.map((p) => p.id) ?? [];
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someSelected = pageIds.some((id) => selected.has(id));
  const categoryName = categories.data?.find((c) => c.id === categoryId)?.name;

  function resetPage() {
    setPage(1);
    setSelected(new Set());
  }

  function toggleRow(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const fetchPage = (p: number) =>
        queryClient.fetchQuery(trpc.admin.products.list.queryOptions({ ...filters, page: p, pageSize: 100 }));
      const first = await fetchPage(1);
      const rest = await Promise.all(
        Array.from({ length: Math.max(0, first.pageCount - 1) }, (_, i) => fetchPage(i + 2))
      );
      const items = [first, ...rest].flatMap((r) => r.items);
      downloadCsv(
        `produk-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Nama", "SKU", "Slug", "Kategori", "Kondisi", "Harga", "Stok tersedia", "Status"],
        items.map((p) => [
          p.name,
          p.sku ?? "",
          p.slug,
          p.categoryName,
          p.condition === "baru" ? "Baru" : "Bekas",
          p.price,
          p.available,
          p.isActive ? "Aktif" : "Nonaktif",
        ])
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengekspor produk");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[28px]/9 font-bold tracking-[-0.6px] text-ink-900">Produk</h1>
          <p className="text-sm/[17px] text-ink-500">
            {allCount.data && activeCount.data
              ? `${allCount.data.total} produk, ${activeCount.data.total} aktif`
              : "Memuat produk..."}
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="outline" className={outlineButton} disabled={exporting} onClick={exportCsv}>
            {exporting ? <Spinner /> : <DownloadIcon />}
            Ekspor
          </Button>
          <Button asChild className={cn(primaryButton, "flex-1 sm:flex-none")}>
            <Link href="/admin/produk/baru">
              <PlusIcon />
              Tambah Produk
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex h-[38px] w-full items-center gap-2 rounded-md border border-ink-300 bg-white px-3 focus-within:ring-3 focus-within:ring-ring/50 sm:w-80">
          <SearchIcon className="size-[15px] shrink-0 text-ink-500" />
          <input
            className="min-w-0 flex-1 bg-transparent text-[13px]/4 text-ink-900 outline-none placeholder:text-ink-500"
            placeholder="Cari nama atau deskripsi"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              resetPage();
            }}
            aria-label="Cari produk"
          />
        </label>

        <div role="radiogroup" aria-label="Kondisi" className="flex gap-0.5 rounded-md bg-ink-100 p-[3px]">
          {CONDITION_OPTIONS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={condition === value}
              onClick={() => {
                setCondition(value);
                resetPage();
              }}
              className={cn(
                "cursor-pointer rounded-sm px-3.5 py-1.5 text-[13px]/4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                condition === value
                  ? "bg-white font-semibold text-ink-900 shadow-[0_1px_2px_#1C19171A]"
                  : "font-medium text-ink-600 hover:text-ink-900"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className={filterButton} aria-label="Filter kategori">
            {categoryName ?? "Kategori"}
            <ChevronDownIcon className="size-3.5 text-ink-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-80 min-w-48">
            <DropdownMenuRadioGroup
              value={categoryId}
              onValueChange={(v) => {
                setCategoryId(v);
                resetPage();
              }}
            >
              <DropdownMenuRadioItem value="">Semua kategori</DropdownMenuRadioItem>
              {categories.data?.map((c) => (
                <DropdownMenuRadioItem key={c.id} value={c.id}>
                  {c.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className={filterButton} aria-label="Filter status">
            {STATUS_LABEL[status]}
            <ChevronDownIcon className="size-3.5 text-ink-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-40">
            <DropdownMenuRadioGroup
              value={status}
              onValueChange={(v) => {
                setStatus(v as StatusFilter);
                resetPage();
              }}
            >
              <DropdownMenuRadioItem value="semua">Semua status</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="aktif">Aktif</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="nonaktif">Nonaktif</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {products.isError ? (
        <ErrorState description={products.error.message} onRetry={() => products.refetch()} />
      ) : data && data.items.length === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title={filtered ? "Produk tidak ditemukan" : "Belum ada produk"}
          description={
            filtered ? "Coba kata kunci atau filter lain." : "Tambahkan produk pertama agar tampil di katalog."
          }
          action={
            filtered ? null : (
              <Button asChild className={primaryButton}>
                <Link href="/admin/produk/baru">
                  <PlusIcon />
                  Tambah Produk
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-[12px] border border-ink-200 bg-white">
            <table className="w-full min-w-[960px] table-fixed border-collapse text-left">
              <colgroup>
                {COLUMNS.map((c, i) => (
                  <col key={i} style={"width" in c ? { width: c.width } : undefined} />
                ))}
              </colgroup>
              <thead>
                <tr className="h-9 border-b border-ink-200 bg-ink-50">
                  {COLUMNS.map((c, i) => (
                    <th
                      key={i}
                      className={cn(
                        cell,
                        "text-xs/[15px] font-semibold text-ink-500",
                        "right" in c && "text-right"
                      )}
                    >
                      {i === 0 ? (
                        <Checkbox
                          className="block border-ink-300 bg-white"
                          checked={allSelected ? true : someSelected ? "indeterminate" : false}
                          onCheckedChange={(checked) =>
                            setSelected(checked === true ? new Set(pageIds) : new Set())
                          }
                          aria-label="Pilih semua produk di halaman ini"
                        />
                      ) : "label" in c ? (
                        c.label
                      ) : (
                        <span className="sr-only">Aksi</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data
                  ? data.items.map((p) => (
                      <tr
                        key={p.id}
                        className="h-[68px] border-b border-ink-200 transition-colors last:border-0 hover:bg-ink-50"
                      >
                        <td className={cell}>
                          <Checkbox
                            className="block border-ink-300 bg-white"
                            checked={selected.has(p.id)}
                            onCheckedChange={(checked) => toggleRow(p.id, checked === true)}
                            aria-label={`Pilih ${p.name}`}
                          />
                        </td>
                        <td className={cell}>
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "flex size-11 shrink-0 items-center justify-center rounded-md bg-ink-100 text-ink-500",
                                !p.isActive && "opacity-50"
                              )}
                            >
                              {p.thumbnailUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.thumbnailUrl} alt="" className="size-full rounded-md object-cover" />
                              ) : (
                                <PackageIcon className="size-5" />
                              )}
                            </span>
                            <div className="flex min-w-0 flex-col gap-0.5">
                              <Link
                                href={`/admin/produk/${p.id}`}
                                className={cn(
                                  "truncate text-sm/[17px] font-semibold hover:text-brand-600",
                                  p.isActive ? "text-ink-900" : "text-ink-500"
                                )}
                              >
                                {p.name}
                              </Link>
                              <span className={cn("truncate text-xs/4 text-ink-500", monoFont)}>{p.sku ?? p.slug}</span>
                            </div>
                          </div>
                        </td>
                        <td className={cn(cell, "truncate text-sm/[17px] text-ink-600")}>{p.categoryName}</td>
                        <td className={cell}>
                          <AdminConditionBadge condition={p.condition} />
                        </td>
                        <td className={cn(cell, "text-right text-sm/[17px] font-semibold text-ink-900 tabular-nums")}>
                          {formatRupiah(p.price)}
                        </td>
                        <td className={cell}>
                          <StockCell available={p.available} />
                        </td>
                        <td className={cell}>
                          <Switch
                            checked={p.isActive}
                            disabled={setActive.isPending && setActive.variables?.id === p.id}
                            onCheckedChange={(isActive) => setActive.mutate({ id: p.id, isActive })}
                            aria-label={p.isActive ? "Nonaktifkan produk" : "Aktifkan produk"}
                            className={rowSwitch}
                          />
                        </td>
                        <td className={cell}>
                          <div className="flex justify-end gap-1">
                            <Link
                              href={`/admin/produk/${p.id}`}
                              aria-label={`Ubah ${p.name}`}
                              className="flex size-[26px] items-center justify-center rounded-sm text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                            >
                              <PencilIcon className="size-[15px]" />
                            </Link>
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger
                                aria-label="Aksi lain"
                                className="flex size-[26px] items-center justify-center rounded-sm text-ink-600 outline-none hover:bg-ink-100 hover:text-ink-900 focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-ink-100"
                              >
                                <EllipsisIcon className="size-[15px]" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  variant="destructive"
                                  onSelect={() => setToDelete({ id: p.id, name: p.name, isActive: p.isActive })}
                                >
                                  <Trash2Icon />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                  : Array.from({ length: 6 }, (_, i) => (
                      <tr key={i} className="h-[68px] border-b border-ink-200 last:border-0">
                        <td colSpan={COLUMNS.length} className="px-5">
                          <Skeleton className="h-11 w-full" />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {data && data.total > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13px]/4 text-ink-500">
                {from} sampai {to} dari {data.total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className={pagerButton}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeftIcon />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  className={pagerButton}
                  disabled={page >= data.pageCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRightIcon />
                  Berikutnya
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <DeleteProductDialog product={toDelete} onOpenChange={(open) => !open && setToDelete(null)} />
    </div>
  );
}

function StockCell({ available }: { available: number }) {
  const tone =
    available <= 0
      ? { Icon: CircleXIcon, text: "Habis", className: "font-semibold text-error" }
      : available <= LOW_STOCK
        ? { Icon: TriangleAlertIcon, text: String(available), className: "font-semibold text-warning" }
        : { Icon: null, text: String(available), className: "font-medium text-ink-900" };
  return (
    <span className={cn("flex items-center justify-end gap-1.5 text-sm/[17px] tabular-nums", tone.className)}>
      {tone.Icon ? <tone.Icon className="size-3.5" /> : null}
      {tone.text}
    </span>
  );
}
