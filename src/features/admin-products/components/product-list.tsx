"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FlameIcon,
  MoreHorizontalIcon,
  PackageIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState, ErrorState, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah } from "@/lib/format";
import { useTRPC } from "@/trpc/client";
import { useDebouncedValue } from "../hooks/use-debounced-value";
import { useSetProductActive } from "../hooks/use-product-mutations";
import { AdminConditionBadge } from "./condition-badge";
import { DeleteProductDialog } from "./delete-product-dialog";

const PAGE_SIZE = 20;
type StatusFilter = "semua" | "aktif" | "nonaktif";

export function ProductList() {
  const trpc = useTRPC();
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<StatusFilter>("semua");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<{ id: string; name: string; isActive: boolean } | null>(null);
  const search = useDebouncedValue(q.trim());

  const categories = useQuery(trpc.admin.categories.list.queryOptions());
  const products = useQuery(
    trpc.admin.products.list.queryOptions(
      {
        q: search || undefined,
        categoryId: categoryId || undefined,
        isActive: status === "semua" ? undefined : status === "aktif",
        page,
        pageSize: PAGE_SIZE,
      },
      { placeholderData: keepPreviousData }
    )
  );
  const setActive = useSetProductActive();

  const data = products.data;
  const filtered = Boolean(search || categoryId || status !== "semua");
  const from = data ? (data.page - 1) * PAGE_SIZE + 1 : 0;
  const to = data ? from + data.items.length - 1 : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Produk"
        description={data ? `${data.total} produk` : "Memuat produk..."}
        actions={
          <Button asChild size="lg">
            <Link href="/admin/produk/baru">
              <PlusIcon />
              Tambah Produk
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <InputGroup className="h-9 bg-white sm:max-w-xs">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Cari nama atau deskripsi"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            aria-label="Cari produk"
          />
        </InputGroup>
        <div className="flex gap-2">
          <NativeSelect
            className="flex-1 bg-white sm:flex-none"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            aria-label="Filter kategori"
          >
            <NativeSelectOption value="">Semua kategori</NativeSelectOption>
            {categories.data?.map((c) => (
              <NativeSelectOption key={c.id} value={c.id}>
                {c.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            className="flex-1 bg-white sm:flex-none"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter);
              setPage(1);
            }}
            aria-label="Filter status"
          >
            <NativeSelectOption value="semua">Semua status</NativeSelectOption>
            <NativeSelectOption value="aktif">Aktif</NativeSelectOption>
            <NativeSelectOption value="nonaktif">Nonaktif</NativeSelectOption>
          </NativeSelect>
        </div>
      </div>

      {products.isError ? (
        <ErrorState description={products.error.message} onRetry={() => products.refetch()} />
      ) : data && data.items.length === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title={filtered ? "Produk tidak ditemukan" : "Belum ada produk"}
          description={
            filtered
              ? "Coba kata kunci atau filter lain."
              : "Tambahkan produk pertama agar tampil di katalog."
          }
          action={
            filtered ? null : (
              <Button asChild>
                <Link href="/admin/produk/baru">
                  <PlusIcon />
                  Tambah Produk
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
          <Table>
            <TableHeader className="bg-ink-50">
              <TableRow>
                <TableHead className="pl-4">Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Kondisi</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-right">Stok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20 pr-4">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data
                ? data.items.map((p) => (
                    <TableRow key={p.id} className={p.isActive ? undefined : "text-ink-500"}>
                      <TableCell className="max-w-72 pl-4">
                        <Link
                          href={`/admin/produk/${p.id}`}
                          className="block truncate font-medium text-ink-900 hover:text-brand-600"
                        >
                          {p.name}
                        </Link>
                        <span className="block truncate text-xs text-ink-500">/{p.slug}</span>
                      </TableCell>
                      <TableCell>{p.categoryName}</TableCell>
                      <TableCell>
                        <AdminConditionBadge condition={p.condition} />
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatRupiah(p.price)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <StockCell available={p.available} />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={p.isActive}
                          disabled={setActive.isPending && setActive.variables?.id === p.id}
                          onCheckedChange={(isActive) => setActive.mutate({ id: p.id, isActive })}
                          aria-label={p.isActive ? "Nonaktifkan produk" : "Aktifkan produk"}
                          className="data-checked:bg-success"
                        />
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="icon-sm">
                            <Link href={`/admin/produk/${p.id}`} aria-label={`Ubah ${p.name}`}>
                              <PencilIcon />
                            </Link>
                          </Button>
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label="Aksi lain">
                                <MoreHorizontalIcon />
                              </Button>
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
                      </TableCell>
                    </TableRow>
                  ))
                : Array.from({ length: 6 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7} className="px-4">
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          {data && data.total > 0 ? (
            <div className="flex items-center justify-between gap-2 border-t border-ink-200 px-4 py-3 text-sm text-ink-500">
              <span>
                {from} sampai {to} dari {data.total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeftIcon />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pageCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Berikutnya
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <DeleteProductDialog product={toDelete} onOpenChange={(open) => !open && setToDelete(null)} />
    </div>
  );
}

function StockCell({ available }: { available: number }) {
  if (available <= 0) {
    return <span className="text-xs font-semibold text-error">Habis</span>;
  }
  if (available <= 2) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-warning">
        <FlameIcon className="size-3.5" />
        {available}
      </span>
    );
  }
  return <span className="font-medium text-ink-900">{available}</span>;
}
