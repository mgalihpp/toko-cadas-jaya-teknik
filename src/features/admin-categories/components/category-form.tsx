"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, CheckIcon, FolderIcon, LinkIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import type { CategoryIconKey } from "@/lib/category-icon-keys";
import { slugify } from "@/lib/slug";
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
    return <ErrorState description={categories.error.message} onRetry={() => categories.refetch()} />;
  }
  if (!categories.data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-64 w-full max-w-[560px]" />
      </div>
    );
  }
  const category = categories.data.find((c) => c.id === id);
  if (!category) {
    return (
      <EmptyState
        icon={FolderIcon}
        title="Kategori tidak ditemukan"
        description="Kategori ini mungkin sudah dihapus."
        action={
          <Button asChild variant="outline">
            <Link href="/admin/kategori">Kembali ke kategori</Link>
          </Button>
        }
      />
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

  const slug = slugify(name);
  const nameId = `${fieldId}-name`;
  const slugId = `${fieldId}-slug`;
  const title = target.mode === "edit" ? "Ubah Kategori" : "Tambah Kategori";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <Button
            asChild
            variant="outline"
            className="size-9 shrink-0 rounded-[8px] border-ink-200 p-0 text-ink-700"
          >
            <Link href="/admin/kategori" aria-label="Kembali ke daftar kategori">
              <ArrowLeftIcon />
            </Link>
          </Button>
          <h1 className="font-heading text-[26px] leading-[33px] font-bold tracking-[-0.6px] text-ink-900">
            {title}
          </h1>
        </div>
        <div className="flex gap-2.5">
          <Button
            asChild
            variant="outline"
            className="h-[37px] flex-1 rounded-[8px] border-ink-300 bg-white px-4 font-semibold text-ink-900 sm:flex-none"
          >
            <Link href="/admin/kategori">Batal</Link>
          </Button>
          <Button
            type="submit"
            disabled={pending}
            className="h-[37px] rounded-[8px] flex-1 gap-2 px-4 font-semibold sm:flex-none"
          >
            {pending ? <Spinner /> : <CheckIcon />}
            Simpan
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-12 pt-2 lg:flex-row">
        <div className="flex w-full flex-col gap-[22px] lg:w-[560px] lg:shrink-0">
          <Field data-invalid={Boolean(error)} className="gap-1.5">
            <FieldLabel htmlFor={nameId} className="text-[13px] leading-4 font-semibold text-ink-900">
              Nama kategori
            </FieldLabel>
            <Input
              id={nameId}
              className="h-[42px] rounded-[8px] border-ink-300 bg-white px-3 text-sm text-ink-900 focus-visible:border-brand-600 focus-visible:ring-1 focus-visible:ring-brand-600 md:text-sm"
              placeholder="Contoh: Gergaji Mesin"
              value={name}
              autoFocus
              onChange={(e) => {
                setName(e.target.value);
                setError(undefined);
              }}
              aria-invalid={Boolean(error)}
            />
            {error ? (
              <FieldError className="text-xs">{error}</FieldError>
            ) : (
              <FieldDescription className="text-xs leading-[15px] text-ink-500">
                Tampil di menu dan filter katalog
              </FieldDescription>
            )}
          </Field>

          <div className="flex flex-col gap-1.5">
            <span id={`${fieldId}-icon`} className="text-[13px] leading-4 font-semibold text-ink-900">
              Ikon
            </span>
            <div
              role="radiogroup"
              aria-labelledby={`${fieldId}-icon`}
              className="grid grid-cols-4 gap-2 sm:grid-cols-8"
            >
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
                      "flex h-11 cursor-pointer items-center justify-center rounded-[8px] border outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      icon === key
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-ink-300 bg-white text-ink-700 hover:bg-ink-50"
                    )}
                  >
                    <Icon className="size-5" />
                  </button>
                )
              )}
            </div>
            <FieldDescription className="text-xs leading-[15px] text-ink-500">
              Klik lagi untuk memakai ikon otomatis dari nama
            </FieldDescription>
          </div>

          <Field className="gap-1.5">
            <FieldLabel htmlFor={slugId} className="text-[13px] leading-4 font-semibold text-ink-900">
              Slug URL
            </FieldLabel>
            <div className="flex h-[42px] items-center gap-2 rounded-[8px] border border-ink-300 bg-ink-50 px-3">
              <LinkIcon className="size-4 shrink-0 text-ink-500" />
              <input
                id={slugId}
                readOnly
                tabIndex={-1}
                value={slug}
                placeholder="dibuat-dari-nama"
                className="min-w-0 flex-1 bg-transparent font-mono text-sm text-ink-600 outline-none placeholder:text-ink-500"
              />
            </div>
            <FieldDescription className="text-xs leading-[15px] text-ink-500">Dibuat otomatis dari nama</FieldDescription>
          </Field>
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <span className="text-[13px] leading-4 font-semibold text-ink-500">Pratinjau di katalog</span>
          <div className="flex w-[200px] flex-col gap-3.5 rounded-[12px] border border-ink-200 bg-white px-[19px] py-[27px]">
            <CategoryIcon slug={slug} icon={icon} className="size-7 text-ink-900" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-[15px] leading-[18px] font-semibold text-ink-900">
                {name.trim() || "Nama kategori"}
              </span>
              <span className="text-xs leading-[15px] text-ink-500">
                {target.mode === "edit" ? target.productCount : 0} produk
              </span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
