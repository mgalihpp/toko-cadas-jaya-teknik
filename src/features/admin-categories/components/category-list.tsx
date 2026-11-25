"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderIcon, PencilIcon, PlusIcon, SearchIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AdminHeader, AdminHeaderAction } from "@/components/layout";
import { MButton } from "@/components/mobile/m-button";
import { BottomSheet, SheetRoot } from "@/components/mobile/sheet";
import { EmptyState, ErrorState } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { CategoryIcon } from "./category-icon";

export function CategoryList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const categories = useQuery(trpc.admin.categories.list.queryOptions());
  const [q, setQ] = useState("");
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const remove = useMutation(
    trpc.admin.categories.delete.mutationOptions({
      onSuccess: async () => {
        toast.success("Kategori dihapus");
        setToDelete(null);
        await Promise.all([
          queryClient.invalidateQueries(trpc.admin.categories.pathFilter()),
          queryClient.invalidateQueries(trpc.catalog.pathFilter()),
        ]);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const rows = (categories.data ?? []).filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="flex flex-1 flex-col">
      <AdminHeader
        title="Kategori"
        right={
          <AdminHeaderAction label="Tambah kategori" href="/admin/kategori/baru">
            <PlusIcon className="size-6" strokeWidth={1.8} />
          </AdminHeaderAction>
        }
      />
      <div className="bg-white px-3 py-2.5">
        <div className="flex h-11 items-center gap-2 rounded-[10px] bg-ink-50 px-3">
          <SearchIcon className="size-5 text-brand-600" strokeWidth={2} />
          <input
            type="search"
            aria-label="Cari kategori"
            placeholder="Cari kategori"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-500"
          />
        </div>
      </div>

      {categories.isError ? (
        <ErrorState description={categories.error.message} onRetry={() => categories.refetch()} />
      ) : !categories.data ? (
        <div role="status" className="flex flex-col">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2 border-b border-ink-200 bg-white p-3">
              <Skeleton className="size-[42px] rounded-xl" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FolderIcon}
          title={q ? "Kategori tidak ditemukan" : "Belum ada kategori"}
          description={q ? "Coba kata kunci lain." : "Kategori membantu pelanggan menyaring produk di katalog."}
        />
      ) : (
        <ul>
          {rows.map((c) => {
            const used = c.productCount > 0;
            return (
              <li key={c.id} className="flex items-center gap-2 border-b border-ink-200 bg-white py-2 pr-2 pl-3">
                <span className="flex size-[42px] shrink-0 items-center justify-center rounded-xl bg-brand-100">
                  <CategoryIcon slug={c.slug} icon={c.icon} className="size-6 text-brand-600" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-px">
                  <p className="truncate text-[15px] font-bold text-ink-900">{c.name}</p>
                  <p className="text-xs text-ink-500">{c.productCount} produk</p>
                </div>
                <Link
                  href={`/admin/kategori/${c.id}`}
                  aria-label={`Ubah ${c.name}`}
                  className="flex size-10 items-center justify-center rounded-full text-brand-600"
                >
                  <PencilIcon className="size-5" strokeWidth={1.8} />
                </Link>
                <button
                  type="button"
                  aria-label={`Hapus ${c.name}`}
                  disabled={used}
                  title={used ? "Kategori masih dipakai produk" : undefined}
                  onClick={() => setToDelete({ id: c.id, name: c.name })}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full",
                    used ? "text-[#B6C2CD]" : "text-error",
                  )}
                >
                  <Trash2Icon className="size-5" strokeWidth={1.8} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <SheetRoot open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <BottomSheet title="Hapus kategori">
          <div className="flex flex-col gap-3 px-4 pt-2 pb-5">
            <div className="flex gap-2.5 rounded-[10px] border border-error-border bg-error-soft p-3">
              <TriangleAlertIcon className="size-5 shrink-0 text-error" strokeWidth={2} />
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-bold text-error">Hapus kategori?</p>
                <p className="text-[13px] text-ink-900">
                  Kategori {toDelete?.name} akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
                </p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <MButton variant="outline" size="lg" className="w-[110px]" onClick={() => setToDelete(null)}>
                Batal
              </MButton>
              <MButton
                variant="danger"
                size="lg"
                block
                loading={remove.isPending}
                onClick={() => toDelete && remove.mutate({ id: toDelete.id })}
              >
                Hapus kategori
              </MButton>
            </div>
          </div>
        </BottomSheet>
      </SheetRoot>
    </div>
  );
}
