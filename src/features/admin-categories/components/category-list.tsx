"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderIcon, InfoIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState } from "@/components/shared";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { CategoryIcon } from "./category-icon";

type Category = { id: string; name: string; productCount: number };

const headClass = "h-auto px-2 py-2.5 text-xs leading-[15px] font-semibold text-ink-500";

export function CategoryList() {
  const trpc = useTRPC();
  const categories = useQuery(trpc.admin.categories.list.queryOptions());
  const [toDelete, setToDelete] = useState<Category | null>(null);

  const addButton = (
    <Button asChild className="h-[37px] gap-2 rounded-[8px] px-4 font-semibold">
      <Link href="/admin/kategori/baru">
        <PlusIcon />
        Tambah Kategori
      </Link>
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-[26px] leading-[33px] font-bold tracking-[-0.6px] text-ink-900">
            Kategori
          </h1>
          <p className="text-[13px] leading-4 text-ink-500">
            {categories.data ? `${categories.data.length} kategori` : "Memuat kategori..."}
          </p>
        </div>
        {addButton}
      </div>

      {categories.isError ? (
        <ErrorState description={categories.error.message} onRetry={() => categories.refetch()} />
      ) : categories.data?.length === 0 ? (
        <EmptyState
          icon={FolderIcon}
          title="Belum ada kategori"
          description="Kategori membantu pelanggan menyaring produk di katalog."
          action={addButton}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-[12px] border border-ink-200 bg-white">
            <Table>
              <TableHeader className="bg-ink-50">
                <TableRow className="border-ink-200 hover:bg-transparent">
                  <TableHead className={cn(headClass, "pl-5")}>Nama</TableHead>
                  <TableHead className={cn(headClass, "w-[236px]")}>Slug</TableHead>
                  <TableHead className={cn(headClass, "w-[116px]")}>Produk</TableHead>
                  <TableHead className={cn(headClass, "w-[136px]")}>Diubah</TableHead>
                  <TableHead className={cn(headClass, "w-[118px] pr-5")}>
                    <span className="sr-only">Aksi</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.data
                  ? categories.data.map((c) => {
                      const used = c.productCount > 0;
                      return (
                        <TableRow key={c.id} className="h-[59px] border-ink-200">
                          <TableCell className="py-[11.5px] pr-2 pl-5">
                            <div className="flex items-center gap-3">
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-ink-100 text-ink-700">
                                <CategoryIcon slug={c.slug} icon={c.icon} className="size-[17px]" />
                              </span>
                              <span className="text-sm font-semibold text-ink-900">{c.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-[11.5px] font-mono text-[13px] text-ink-500">
                            /{c.slug}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "px-2 py-[11.5px] text-sm font-medium tabular-nums",
                              used ? "text-ink-900" : "text-ink-500"
                            )}
                          >
                            {c.productCount}
                          </TableCell>
                          <TableCell className="px-2 py-[11.5px] text-[13px] text-ink-500">
                            {formatDate(c.updatedAt)}
                          </TableCell>
                          <TableCell className="py-[11.5px] pr-5 pl-2">
                            <div className="flex justify-end gap-1">
                              <Button
                                asChild
                                variant="ghost"
                                className="size-[30px] rounded-[6px] p-0 text-ink-600 [&_svg:not([class*='size-'])]:size-[15px]"
                              >
                                <Link href={`/admin/kategori/${c.id}`} aria-label={`Ubah ${c.name}`}>
                                  <PencilIcon />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                className={cn(
                                  "size-[30px] rounded-[6px] p-0 hover:bg-error-soft hover:text-error [&_svg:not([class*='size-'])]:size-[15px]",
                                  used ? "text-ink-300" : "text-error"
                                )}
                                onClick={() => setToDelete(c)}
                                aria-label={`Hapus ${c.name}`}
                                title={used ? "Masih dipakai produk" : undefined}
                              >
                                <Trash2Icon />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  : Array.from({ length: 5 }, (_, i) => (
                      <TableRow key={i} className="h-[59px] border-ink-200">
                        <TableCell colSpan={5} className="px-5">
                          <Skeleton className="h-9 w-full" />
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
          <p className="flex items-center gap-2.5 rounded-[10px] bg-ink-50 p-3.5 text-[13px] leading-4 text-ink-600">
            <InfoIcon className="size-4 shrink-0 text-ink-500" />
            Kategori yang masih dipakai produk tidak bisa dihapus. Pindahkan produknya dulu.
          </p>
        </>
      )}

      <DeleteCategoryDialog category={toDelete} onClose={() => setToDelete(null)} />
    </div>
  );
}

function DeleteCategoryDialog({
  category,
  onClose,
}: {
  category: Category | null;
  onClose: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const remove = useMutation(
    trpc.admin.categories.delete.mutationOptions({
      onSuccess: async () => {
        toast.success("Kategori dihapus");
        close();
        await Promise.all([
          queryClient.invalidateQueries(trpc.admin.categories.pathFilter()),
          queryClient.invalidateQueries(trpc.catalog.pathFilter()),
        ]);
      },
    })
  );

  function close() {
    remove.reset();
    onClose();
  }

  const blocked = remove.error?.data?.code === "CONFLICT";

  return (
    <AlertDialog open={category !== null} onOpenChange={(open) => !open && close()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-error-soft text-error">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>
            {blocked ? "Kategori tidak bisa dihapus" : "Hapus kategori ini?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {remove.error ? (
              <>
                {remove.error.message}.{" "}
                {blocked ? (
                  <Link href="/admin/produk" className="font-medium text-brand-600">
                    Lihat produk
                  </Link>
                ) : null}
              </>
            ) : (
              <>
                Kategori <span className="font-medium text-ink-900">{category?.name}</span> akan
                dihapus permanen.
                {category && category.productCount > 0
                  ? ` Kategori ini masih dipakai ${category.productCount} produk.`
                  : null}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>{blocked ? "Tutup" : "Batal"}</AlertDialogCancel>
          {blocked ? null : (
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => category && remove.mutate({ id: category.id })}
            >
              {remove.isPending ? <Spinner /> : <Trash2Icon />}
              Hapus
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
