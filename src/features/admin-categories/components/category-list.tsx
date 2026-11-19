"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderIcon, InfoIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState, PageHeader } from "@/components/shared";
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
import { useTRPC } from "@/trpc/client";
import { CategoryDialog, type CategoryDialogState } from "./category-dialog";

type Category = { id: string; name: string; productCount: number };

export function CategoryList() {
  const trpc = useTRPC();
  const categories = useQuery(trpc.admin.categories.list.queryOptions());
  const [dialog, setDialog] = useState<CategoryDialogState>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  const addButton = (
    <Button size="lg" onClick={() => setDialog({ mode: "create" })}>
      <PlusIcon />
      Tambah Kategori
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Kategori"
        description={categories.data ? `${categories.data.length} kategori` : "Memuat kategori..."}
        actions={addButton}
      />

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
        <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
          <Table>
            <TableHeader className="bg-ink-50">
              <TableRow>
                <TableHead className="pl-4">Nama</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Produk</TableHead>
                <TableHead className="w-24 pr-4">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.data
                ? categories.data.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="pl-4 font-medium text-ink-900">{c.name}</TableCell>
                      <TableCell className="font-mono text-xs text-ink-500">/{c.slug}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {c.productCount > 0 ? (
                          c.productCount
                        ) : (
                          <span className="text-ink-500">0</span>
                        )}
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDialog({ mode: "edit", id: c.id, name: c.name })}
                            aria-label={`Ubah ${c.name}`}
                          >
                            <PencilIcon />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-error hover:bg-error-soft hover:text-error"
                            onClick={() => setToDelete(c)}
                            aria-label={`Hapus ${c.name}`}
                          >
                            <Trash2Icon />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                : Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4} className="px-4">
                        <Skeleton className="h-7 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          <p className="flex items-center gap-2 border-t border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-600">
            <InfoIcon className="size-4 shrink-0 text-ink-500" />
            Kategori yang masih dipakai produk tidak bisa dihapus. Pindahkan produknya dulu.
          </p>
        </div>
      )}

      <CategoryDialog state={dialog} onOpenChange={(open) => !open && setDialog(null)} />
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
