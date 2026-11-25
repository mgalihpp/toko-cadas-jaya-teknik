"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, FolderIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/layout";
import { MButton, MLink } from "@/components/mobile/m-button";
import { StickyBar } from "@/components/mobile/sticky-bar";
import { EmptyState, ErrorState } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import type { CategoryIconKey } from "@/lib/category-icon-keys";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { categoryNameSchema } from "../schemas";
import { CategoryIcon } from "./category-icon";

type Target =
  | { mode: "create" }
  | { mode: "edit"; id: string; name: string; slug: string; icon: string | null; productCount: number };

export function CategoryCreateForm() {
  return <CategoryForm target={{ mode: "create" }} />;
}

export function CategoryEditForm({ id }: { id: string }) {
  const trpc = useTRPC();
  const categories = useQuery(trpc.admin.categories.list.queryOptions());

  if (categories.isError) {
    return (
      <div className="flex flex-1 flex-col">
        <AdminHeader title="Ubah kategori" backHref="/admin/kategori" />
        <ErrorState description={categories.error.message} onRetry={() => categories.refetch()} />
      </div>
    );
  }
  if (!categories.data) {
    return (
      <div className="flex flex-1 flex-col">
        <AdminHeader title="Ubah kategori" backHref="/admin/kategori" />
        <Skeleton className="h-64 w-full rounded-none" />
      </div>
    );
  }
  const category = categories.data.find((c) => c.id === id);
  if (!category) {
    return (
      <div className="flex flex-1 flex-col">
        <AdminHeader title="Ubah kategori" backHref="/admin/kategori" />
        <EmptyState
          icon={FolderIcon}
          title="Kategori tidak ditemukan"
          description="Kategori ini mungkin sudah dihapus."
          action={
            <MLink href="/admin/kategori" variant="secondary" className="h-[46px] px-6">
              Kembali ke kategori
            </MLink>
          }
        />
      </div>
    );
  }
  return <CategoryForm key={category.id} target={{ mode: "edit", ...category }} />;
}

function CategoryForm({ target }: { target: Target }) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState(target.mode === "edit" ? target.name : "");
  const [icon, setIcon] = useState<CategoryIconKey | null>(
    target.mode === "edit" && target.icon && target.icon in CATEGORY_ICONS ? (target.icon as CategoryIconKey) : null
  );
  const [error, setError] = useState<string>();
  const fieldId = useId();

  const options = {
    onSuccess: async () => {
      toast.success(target.mode === "edit" ? "Kategori diperbarui" : "Kategori ditambahkan");
      if (target.mode === "create") setName("");
      await Promise.all([
        queryClient.invalidateQueries(trpc.admin.categories.pathFilter()),
        queryClient.invalidateQueries(trpc.admin.products.pathFilter()),
        queryClient.invalidateQueries(trpc.catalog.pathFilter()),
      ]);
      router.push("/admin/kategori");
    },
    onError: (e: { message: string }) => setError(e.message),
  };
  const create = useMutation(trpc.admin.categories.create.mutationOptions(options));
  const update = useMutation(trpc.admin.categories.update.mutationOptions(options));
  const pending = create.isPending || update.isPending;

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = categoryNameSchema.safeParse(name);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    if (target.mode === "edit") update.mutate({ id: target.id, name: parsed.data, icon });
    else create.mutate({ name: parsed.data, icon });
  }

  const title = target.mode === "edit" ? "Ubah kategori" : "Tambah kategori";
  const nameId = `${fieldId}-name`;
  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col pb-[76px]" noValidate>
      <AdminHeader title={title} backHref="/admin/kategori" />
      <section className="flex flex-col gap-3 bg-white p-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={nameId} className="text-[13px] font-medium text-ink-900">
            Nama kategori
          </label>
          <input
            id={nameId}
            autoFocus
            value={name}
            placeholder="Contoh: Gergaji Mesin"
            onChange={(e) => {
              setName(e.target.value);
              setError(undefined);
            }}
            aria-invalid={Boolean(error)}
            className={cn(
              "h-12 w-full rounded-[10px] bg-white px-3 text-[15px] text-ink-900 outline-none placeholder:text-ink-500",
              error ? "border-2 border-error" : "border-[1.5px] border-ink-200 focus:border-2 focus:border-brand-600",
            )}
          />
          {error ? (
            <p className="text-xs font-medium text-error">{error}</p>
          ) : (
            <p className="text-xs font-medium text-ink-500">Tampil di menu dan filter katalog</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <span id={`${fieldId}-icon`} className="text-[13px] font-medium text-ink-900">
            Ikon
          </span>
          <div role="radiogroup" aria-labelledby={`${fieldId}-icon`} className="grid grid-cols-4 gap-2">
            {(Object.entries(CATEGORY_ICONS) as [CategoryIconKey, (typeof CATEGORY_ICONS)[CategoryIconKey]][]).map(
              ([key, { label, Icon }]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={icon === key}
                  aria-label={label}
                  title={label}
                  onClick={() => setIcon(icon === key ? null : key)}
                  className={cn(
                    "flex h-[52px] items-center justify-center rounded-xl border-[1.5px]",
                    icon === key
                      ? "border-brand-600 bg-brand-100 text-brand-700"
                      : "border-ink-200 bg-white text-ink-700",
                  )}
                >
                  <Icon className="size-6" strokeWidth={1.8} />
                </button>
              ),
            )}
          </div>
          <p className="text-xs font-medium text-ink-500">Ketuk lagi untuk memakai ikon otomatis dari nama</p>
        </div>
      </section>
      <StickyBar>
        <MButton variant="outline" size="lg" block onClick={() => router.push("/admin/kategori")}>
          Batal
        </MButton>
        <MButton type="submit" size="lg" block loading={pending}>
          <CheckIcon className="size-[18px]" />
          Simpan
        </MButton>
      </StickyBar>
    </form>
  );
}
