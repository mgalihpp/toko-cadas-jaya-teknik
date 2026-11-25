"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckIcon, ChevronDownIcon, FolderPlusIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/layout";
import { MButton, MLink } from "@/components/mobile/m-button";
import { StickyBar } from "@/components/mobile/sticky-bar";
import { EmptyState, ErrorState } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { useInvalidateProducts } from "../hooks/use-product-mutations";
import {
  MAX_DESCRIPTION,
  productFormSchema,
  type ProductFormErrors,
  type ProductFormValues,
  type SpecRow,
} from "../schemas";
import { DeleteProductDialog } from "./delete-product-dialog";
import { ProductImagesField } from "./product-images-field";

const EMPTY_VALUES: ProductFormValues = {
  name: "",
  sku: "",
  description: "",
  price: "",
  condition: "baru",
  categoryId: "",
  isActive: true,
  stock: "1",
  specs: [],
  images: [],
};

const thousands = new Intl.NumberFormat("id-ID");

function specsToText(rows: SpecRow[]) {
  return rows
    .filter((r) => r.key || r.value)
    .map((r) => `${r.key}: ${r.value}`)
    .join("\n");
}

function textToSpecs(text: string): SpecRow[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf(":");
      return i < 0 ? { key: line, value: "" } : { key: line.slice(0, i).trim(), value: line.slice(i + 1).trim() };
    });
}

export function ProductCreateForm() {
  return <ProductForm />;
}

export function ProductEditForm({ id }: { id: string }) {
  const trpc = useTRPC();
  const product = useQuery(trpc.admin.products.byId.queryOptions({ id }));

  if (product.isError) {
    const notFound = product.error.data?.code === "NOT_FOUND";
    return (
      <div className="flex flex-1 flex-col">
        <AdminHeader title="Ubah produk" backHref="/admin/produk" />
        <ErrorState
          title={notFound ? "Produk tidak ditemukan" : "Gagal memuat produk"}
          description={product.error.message}
          onRetry={notFound ? undefined : () => product.refetch()}
        />
      </div>
    );
  }
  if (!product.data) return <ProductFormSkeleton />;

  const p = product.data;
  return (
    <ProductForm
      key={p.id + p.updatedAt.toString()}
      product={{ id: p.id, name: p.name, isActive: p.isActive }}
      initial={{
        name: p.name,
        sku: p.sku ?? "",
        description: p.description,
        price: thousands.format(p.price),
        condition: p.condition,
        categoryId: p.categoryId,
        isActive: p.isActive,
        stock: String(p.stockPhysical),
        specs: Object.entries(p.specs).map(([key, value]) => ({ key, value })),
        images: p.images.map((img) => ({ url: img.url, fileKey: img.fileKey ?? undefined })),
      }}
    />
  );
}

type EditingProduct = { id: string; name: string; isActive: boolean };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <section className="flex flex-col gap-3 bg-white p-3">
        <h2 className="text-[15px] font-bold text-ink-900">{title}</h2>
        {children}
      </section>
      <div className="h-1.5 shrink-0" />
    </>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink-900">
        {label}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs font-medium text-error">
          <TriangleAlertIcon className="size-3.5" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs font-medium text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

const box = (bad?: boolean) =>
  cn(
    "w-full rounded-[10px] bg-white px-3 text-[15px] text-ink-900 outline-none placeholder:text-ink-500",
    bad ? "border-2 border-error" : "border-[1.5px] border-ink-200 focus:border-2 focus:border-brand-600",
  );

function ProductForm({
  product,
  initial = EMPTY_VALUES,
}: {
  product?: EditingProduct;
  initial?: ProductFormValues;
}) {
  const trpc = useTRPC();
  const router = useRouter();
  const invalidate = useInvalidateProducts();
  const [values, setValues] = useState<ProductFormValues>(initial);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [specsText, setSpecsText] = useState(() => specsToText(initial.specs));
  const [deleting, setDeleting] = useState(false);
  const categories = useQuery(trpc.admin.categories.list.queryOptions());

  const create = useMutation(trpc.admin.products.create.mutationOptions());
  const update = useMutation(trpc.admin.products.update.mutationOptions());
  const pending = create.isPending || update.isPending;

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function submit() {
    const parsed = productFormSchema.safeParse({ ...values, specs: textToSpecs(specsText) });
    if (!parsed.success) {
      const next: ProductFormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ProductFormValues;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    const { stock, ...fields } = parsed.data;
    try {
      if (product) {
        await update.mutateAsync({ id: product.id, ...fields });
        toast.success("Perubahan produk disimpan");
      } else {
        await create.mutateAsync({ ...fields, stock });
        toast.success("Produk ditambahkan");
      }
      await invalidate();
      router.push("/admin/produk");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan produk");
    }
  }

  const title = product ? "Ubah produk" : "Tambah produk";
  const hasErrors = Object.values(errors).some(Boolean);

  if (categories.data?.length === 0) {
    return (
      <div className="flex flex-1 flex-col">
        <AdminHeader title={title} backHref="/admin/produk" />
        <EmptyState
          icon={FolderPlusIcon}
          title="Belum ada kategori"
          description="Buat kategori dulu sebelum menambahkan produk."
          action={
            <MLink href="/admin/kategori/baru" className="h-[46px] px-6">
              Tambah kategori
            </MLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col pb-[76px]">
      <AdminHeader title={title} backHref="/admin/produk" />
      {hasErrors ? (
        <div className="bg-white px-3 py-2.5">
          <div className="flex gap-2.5 rounded-[10px] border border-error-border bg-error-soft p-3">
            <TriangleAlertIcon className="size-5 shrink-0 text-error" strokeWidth={2} />
            <p className="text-[13px] text-ink-900">Periksa isian yang berwarna merah sebelum menyimpan.</p>
          </div>
        </div>
      ) : null}

      <Section title="Foto produk">
        <ProductImagesField images={values.images} onChange={(images) => set("images", images)} />
        {errors.images ? <p className="text-xs font-medium text-error">{errors.images}</p> : null}
      </Section>

      <Section title="Informasi produk">
        <Field id="name" label="Nama produk" error={errors.name}>
          <input
            id="name"
            className={cn(box(Boolean(errors.name)), "h-12")}
            placeholder="Contoh: Gerinda Tangan Makita 9553B"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field id="category" label="Kategori" error={errors.categoryId}>
          <div className="relative">
            <select
              id="category"
              className={cn(box(Boolean(errors.categoryId)), "h-12 appearance-none pr-10", !values.categoryId && "text-ink-500")}
              value={values.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              disabled={!categories.data}
            >
              <option value="" disabled>
                {categories.data ? "Pilih kategori" : "Memuat kategori…"}
              </option>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-ink-500" />
          </div>
        </Field>
        <div className="flex flex-col gap-1.5">
          <span id="condition-label" className="text-[13px] font-medium text-ink-900">
            Kondisi
          </span>
          <div role="radiogroup" aria-labelledby="condition-label" className="flex rounded-[10px] bg-ink-50 p-[3px]">
            {(
              [
                ["baru", "Baru"],
                ["bekas", "Bekas"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={values.condition === value}
                onClick={() => set("condition", value)}
                className={cn(
                  "h-[42px] flex-1 rounded-lg text-sm font-bold",
                  values.condition === value
                    ? "bg-white text-brand-700 shadow-[0_1px_4px_rgba(10,40,70,.15)]"
                    : "text-ink-500",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <Field id="price" label="Harga (Rp)" error={errors.price}>
          <input
            id="price"
            inputMode="numeric"
            className={cn(box(Boolean(errors.price)), "h-12")}
            placeholder="0"
            value={values.price}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
              set("price", digits ? thousands.format(Number(digits)) : "");
            }}
          />
        </Field>
        <Field
          id="stock"
          label="Stok fisik"
          error={errors.stock}
          hint={product ? "Ubah stok lewat menu Stok" : "Barang bekas biasanya 1 unit"}
        >
          <input
            id="stock"
            inputMode="numeric"
            disabled={Boolean(product)}
            className={cn(box(Boolean(errors.stock)), "h-12 disabled:bg-ink-50 disabled:text-ink-500")}
            value={values.stock}
            onChange={(e) => set("stock", e.target.value.replace(/\D/g, ""))}
          />
        </Field>
      </Section>

      <Section title="Detail">
        <Field id="specs" label="Spesifikasi" error={errors.specs} hint="Satu baris satu spesifikasi, contoh: Daya: 550 W">
          <textarea
            id="specs"
            rows={3}
            className={cn(box(Boolean(errors.specs)), "py-2.5")}
            placeholder={"Daya: 550 W\nChuck: 13 mm"}
            value={specsText}
            onChange={(e) => {
              setSpecsText(e.target.value);
              setErrors((er) => ({ ...er, specs: undefined }));
            }}
          />
        </Field>
        <Field
          id="description"
          label="Deskripsi"
          error={errors.description}
          hint={`${thousands.format(values.description.length)} dari ${thousands.format(MAX_DESCRIPTION)} karakter`}
        >
          <textarea
            id="description"
            rows={3}
            className={cn(box(Boolean(errors.description)), "py-2.5")}
            placeholder="Alat bor untuk bengkel dan proyek harian."
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
      </Section>

      <section className="flex flex-col gap-3 bg-white p-3">
        <button
          type="button"
          role="switch"
          aria-checked={values.isActive}
          onClick={() => set("isActive", !values.isActive)}
          className="flex items-center gap-2.5 text-left"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-bold text-ink-900">Tampilkan di katalog</span>
            <span className="text-xs text-ink-500">Nonaktif = disembunyikan, data tetap tersimpan</span>
          </span>
          <span className={cn("relative h-[26px] w-11 rounded-full transition-colors", values.isActive ? "bg-brand-600" : "bg-ink-300")}>
            <span
              className={cn(
                "absolute top-[3px] size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.3)] transition-all",
                values.isActive ? "left-[21px]" : "left-[3px]",
              )}
            />
          </span>
        </button>
      </section>

      {product ? (
        <section aria-labelledby="danger-zone" className="flex flex-col gap-3 border-y border-error-border bg-error-soft p-3">
          <div className="flex flex-col gap-0.5">
            <h2 id="danger-zone" className="text-sm font-bold text-error">
              Zona berbahaya
            </h2>
            <p className="text-xs text-ink-700">Produk yang dihapus tidak bisa dikembalikan. Kalau hanya ingin menyembunyikan, matikan &quot;Tampilkan di katalog&quot;.</p>
          </div>
          <button
            type="button"
            onClick={() => setDeleting(true)}
            className="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-error bg-white text-sm font-bold text-error active:bg-error-soft"
          >
            <Trash2Icon className="size-[18px]" />
            Hapus produk
          </button>
        </section>
      ) : null}

      <StickyBar>
        <MButton variant="outline" size="lg" block onClick={() => router.push("/admin/produk")}>
          Batal
        </MButton>
        <MButton size="lg" block loading={pending} onClick={submit}>
          <CheckIcon className="size-[18px]" />
          Simpan produk
        </MButton>
      </StickyBar>

      {product ? (
        <DeleteProductDialog
          product={deleting ? product : null}
          onOpenChange={setDeleting}
          onDeleted={() => router.push("/admin/produk")}
        />
      ) : null}
    </div>
  );
}

function ProductFormSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <AdminHeader title="Ubah produk" backHref="/admin/produk" />
      <div role="status" className="flex flex-col gap-1.5">
        <Skeleton className="h-36 rounded-none" />
        <Skeleton className="h-96 rounded-none" />
      </div>
    </div>
  );
}
