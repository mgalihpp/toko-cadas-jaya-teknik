"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  BanknoteIcon,
  CheckIcon,
  CircleAlertIcon,
  FolderPlusIcon,
  LightbulbIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { useInvalidateProducts } from "../hooks/use-product-mutations";
import {
  MAX_DESCRIPTION,
  productFormSchema,
  type ProductFormErrors,
  type ProductFormValues,
} from "../schemas";
import {
  dangerButton,
  fieldBox,
  fieldError,
  fieldHint,
  fieldLabel,
  largeSwitch,
  outlineButton,
  primaryButton,
} from "../styles";
import { DeleteProductDialog } from "./delete-product-dialog";
import { ProductImagesField } from "./product-images-field";
import { SpecsField } from "./specs-field";

const EMPTY_VALUES: ProductFormValues = {
  name: "",
  sku: "",
  description: "",
  price: "",
  condition: "baru",
  categoryId: "",
  isActive: true,
  stock: "0",
  specs: [
    { key: "", value: "" },
    { key: "", value: "" },
  ],
  images: [],
};

const CONDITIONS = [
  ["baru", "Baru", "Unit baru bersegel"],
  ["bekas", "Bekas", "Unit bekas, jelaskan kondisinya di deskripsi"],
] as const;

const thousands = new Intl.NumberFormat("id-ID");

function formatPriceInput(raw: string) {
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits ? thousands.format(Number(digits)) : "";
}

function countChanges(values: ProductFormValues, initial: ProductFormValues) {
  return (Object.keys(values) as (keyof ProductFormValues)[]).filter(
    (key) => JSON.stringify(values[key]) !== JSON.stringify(initial[key])
  ).length;
}

export function ProductCreateForm() {
  return <ProductForm />;
}

export function ProductEditForm({ id }: { id: string }) {
  const trpc = useTRPC();
  const product = useQuery(trpc.admin.products.byId.queryOptions({ id }));

  if (product.isError) {
    return (
      <ErrorState
        title={product.error.data?.code === "NOT_FOUND" ? "Produk tidak ditemukan" : "Gagal memuat produk"}
        description={product.error.message}
        onRetry={product.error.data?.code === "NOT_FOUND" ? undefined : () => product.refetch()}
      />
    );
  }
  if (!product.data) return <ProductFormSkeleton />;

  const p = product.data;
  const specs = Object.entries(p.specs).map(([key, value]) => ({ key, value }));
  return (
    <ProductForm
      key={p.id + p.updatedAt.toString()}
      product={{
        id: p.id,
        name: p.name,
        isActive: p.isActive,
        updatedAt: p.updatedAt,
        stockPhysical: p.stockPhysical,
        stockLocked: p.stockLocked,
      }}
      initial={{
        name: p.name,
        sku: p.sku ?? "",
        description: p.description,
        price: thousands.format(p.price),
        condition: p.condition,
        categoryId: p.categoryId,
        isActive: p.isActive,
        stock: String(p.stockPhysical),
        specs: specs.length ? specs : [{ key: "", value: "" }],
        images: p.images.map((img) => ({ url: img.url, fileKey: img.fileKey ?? undefined })),
      }}
    />
  );
}

type EditingProduct = {
  id: string;
  name: string;
  isActive: boolean;
  updatedAt: Date;
  stockPhysical: number;
  stockLocked: number;
};

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
  const [deleting, setDeleting] = useState(false);
  const categories = useQuery(trpc.admin.categories.list.queryOptions());

  const create = useMutation(trpc.admin.products.create.mutationOptions());
  const update = useMutation(trpc.admin.products.update.mutationOptions());
  const pending = create.isPending || update.isPending;
  const changes = product ? countChanges(values, initial) : 0;

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = productFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: ProductFormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ProductFormValues;
        next[key] ??= issue.message;
      }
      setErrors(next);
      toast.error("Periksa kembali isian yang ditandai");
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

  if (categories.data?.length === 0) {
    return (
      <EmptyState
        icon={FolderPlusIcon}
        title="Belum ada kategori"
        description="Buat kategori dulu sebelum menambahkan produk."
        action={
          <Button asChild className={primaryButton}>
            <Link href="/admin/kategori">Kelola kategori</Link>
          </Button>
        }
      />
    );
  }

  const slug = slugify(values.name);

  return (
    <form onSubmit={onSubmit} className="-mt-1 flex flex-1 flex-col gap-7 pb-4" noValidate>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <Link
            href="/admin/produk"
            aria-label="Kembali ke daftar produk"
            className="flex size-9 shrink-0 items-center justify-center rounded-md border border-ink-200 text-ink-700 hover:bg-ink-50"
          >
            <ArrowLeftIcon className="size-4" />
          </Link>
          <div className="flex flex-col gap-0.5">
            <h1 className="font-heading text-[26px]/[33px] font-bold tracking-[-0.6px] text-ink-900">
              {product ? "Edit Produk" : "Tambah Produk"}
            </h1>
            <p className="text-[13px]/4 text-ink-500">
              {product
                ? `Terakhir diubah ${formatDateTime(product.updatedAt)}`
                : "Isi data lalu simpan, produk langsung tampil jika aktif"}
            </p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <Button asChild variant="outline" className={cn(outlineButton, "flex-1 sm:flex-none")}>
            <Link href="/admin/produk">Batal</Link>
          </Button>
          <Button type="submit" disabled={pending} className={cn(primaryButton, "flex-1 sm:flex-none")}>
            {pending ? <Spinner /> : <CheckIcon />}
            {product ? "Simpan Perubahan" : "Simpan Produk"}
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-9">
          <Section title="Informasi dasar">
            <Field data-invalid={Boolean(errors.name)} className="gap-1.5">
              <FieldLabel htmlFor="name" className={fieldLabel}>
                Nama produk
              </FieldLabel>
              <Input
                id="name"
                className={fieldBox}
                placeholder="Contoh: Gerinda Tangan Makita 9553B"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                aria-invalid={Boolean(errors.name)}
              />
              <FieldError className={fieldError}>{errors.name}</FieldError>
            </Field>

            <div className="grid gap-[18px] sm:grid-cols-2 sm:gap-4">
              <Field data-invalid={Boolean(errors.categoryId)} className="gap-1.5">
                <FieldLabel htmlFor="category" className={fieldLabel}>
                  Kategori
                </FieldLabel>
                <NativeSelect
                  id="category"
                  className={cn(
                    "w-full [&_select]:h-[42px] [&_select]:rounded-md [&_select]:border-ink-300 [&_select]:bg-white [&_select]:pr-9 [&_select]:pl-3 [&_select]:text-sm/[17px] [&_[data-slot=native-select-icon]]:right-3 [&_[data-slot=native-select-icon]]:text-ink-500",
                    values.categoryId ? "[&_select]:text-ink-900" : "[&_select]:text-ink-500"
                  )}
                  value={values.categoryId}
                  onChange={(e) => set("categoryId", e.target.value)}
                  aria-invalid={Boolean(errors.categoryId)}
                  disabled={!categories.data}
                >
                  <NativeSelectOption value="" disabled>
                    {categories.data ? "Pilih kategori" : "Memuat kategori..."}
                  </NativeSelectOption>
                  {categories.data?.map((c) => (
                    <NativeSelectOption key={c.id} value={c.id}>
                      {c.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError className={fieldError}>{errors.categoryId}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.sku)} className="gap-1.5">
                <FieldLabel htmlFor="sku" className={fieldLabel}>
                  SKU
                </FieldLabel>
                <Input
                  id="sku"
                  className={cn(fieldBox, "font-mono")}
                  placeholder="Opsional, contoh: MKT-9553B"
                  value={values.sku}
                  onChange={(e) => set("sku", e.target.value)}
                  aria-invalid={Boolean(errors.sku)}
                />
                <FieldError className={fieldError}>{errors.sku}</FieldError>
              </Field>

              <Field className="gap-1.5">
                <FieldLabel htmlFor="slug" className={fieldLabel}>
                  Slug URL
                </FieldLabel>
                <Input
                  id="slug"
                  readOnly
                  tabIndex={-1}
                  className={cn(fieldBox, "focus-visible:border-ink-300 focus-visible:ring-0")}
                  placeholder="Otomatis dari nama produk"
                  value={slug ? `/${slug}` : ""}
                />
              </Field>
            </div>

            <div className="flex flex-col gap-2">
              <span className={fieldLabel} id="condition-label">
                Kondisi
              </span>
              <div role="radiogroup" aria-labelledby="condition-label" className="grid gap-3 sm:grid-cols-2">
                {CONDITIONS.map(([value, label, hint]) => {
                  const active = values.condition === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => set("condition", value)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        active
                          ? "border-2 border-brand-600 bg-brand-50 p-3"
                          : "border border-ink-300 bg-white p-[13px] hover:bg-ink-50"
                      )}
                    >
                      <span
                        className={cn(
                          "size-[18px] shrink-0 rounded-full bg-white",
                          active ? "border-[5px] border-brand-600" : "border-[1.5px] border-ink-300"
                        )}
                      />
                      <span className="flex flex-col gap-0.5">
                        <span className="text-sm/[17px] font-semibold text-ink-900">{label}</span>
                        <span className={fieldHint}>{hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Field data-invalid={Boolean(errors.description)} className="gap-1.5">
              <FieldLabel htmlFor="description" className={fieldLabel}>
                Deskripsi
              </FieldLabel>
              <Textarea
                id="description"
                className={cn(fieldBox, "h-auto min-h-[110px] p-3 text-sm/[21px] md:text-sm/[21px]")}
                placeholder="Jelaskan kegunaan, kelengkapan, dan garansi"
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
                aria-invalid={Boolean(errors.description)}
              />
              {errors.description ? (
                <FieldError className={fieldError}>{errors.description}</FieldError>
              ) : (
                <FieldDescription className={fieldHint}>
                  {thousands.format(values.description.length)} dari {thousands.format(MAX_DESCRIPTION)} karakter
                </FieldDescription>
              )}
            </Field>
          </Section>

          <Section
            title="Foto produk"
            description={
              values.condition === "bekas"
                ? "Foto pertama jadi sampul. Untuk produk bekas, unggah foto kondisi asli"
                : "Foto pertama jadi sampul. JPG, PNG, WebP, maks 2 MB"
            }
          >
            <ProductImagesField images={values.images} onChange={(images) => set("images", images)} />
            <FieldError className={fieldError}>{errors.images}</FieldError>
          </Section>

          <Section title="Spesifikasi" description="Tampil sebagai tabel di halaman produk">
            <SpecsField rows={values.specs} onChange={(specs) => set("specs", specs)} />
            <FieldError className={fieldError}>{errors.specs}</FieldError>
          </Section>
        </div>

        <div className="flex flex-col gap-7">
          <Section title="Harga dan stok">
            <Field data-invalid={Boolean(errors.price)} className="gap-1.5">
              <FieldLabel htmlFor="price" className={fieldLabel}>
                Harga jual
              </FieldLabel>
              <div className="relative">
                <BanknoteIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-500" />
                <Input
                  id="price"
                  inputMode="numeric"
                  className={cn(fieldBox, "pl-9")}
                  placeholder="0"
                  value={values.price}
                  onChange={(e) => set("price", formatPriceInput(e.target.value))}
                  aria-invalid={Boolean(errors.price)}
                />
              </div>
              {errors.price ? (
                <FieldError className={fieldError}>{errors.price}</FieldError>
              ) : product ? (
                <FieldDescription className={fieldHint}>Pesanan lama tetap memakai harga saat dipesan</FieldDescription>
              ) : null}
            </Field>

            {product ? (
              <div className="flex flex-col gap-2.5 rounded-lg bg-ink-50 p-4">
                {(
                  [
                    ["Stok fisik", product.stockPhysical],
                    ["Terkunci pesanan", product.stockLocked],
                    ["Tersedia di katalog", product.stockPhysical - product.stockLocked],
                  ] as const
                ).map(([label, n]) => (
                  <div key={label} className="flex justify-between text-[13px]/4">
                    <span className="text-ink-600">{label}</span>
                    <span className="font-semibold text-ink-900 tabular-nums">{n}</span>
                  </div>
                ))}
                <Link href="/admin/stok" className="w-fit text-[13px]/4 font-semibold text-brand-700 hover:underline">
                  Sesuaikan di halaman Stok
                </Link>
              </div>
            ) : (
              <Field data-invalid={Boolean(errors.stock)} className="gap-1.5">
                <FieldLabel htmlFor="stock" className={fieldLabel}>
                  Stok awal
                </FieldLabel>
                <Input
                  id="stock"
                  className={fieldBox}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={values.stock}
                  onChange={(e) => set("stock", e.target.value)}
                  aria-invalid={Boolean(errors.stock)}
                />
                {errors.stock ? (
                  <FieldError className={fieldError}>{errors.stock}</FieldError>
                ) : (
                  <FieldDescription className={fieldHint}>Untuk barang bekas biasanya 1</FieldDescription>
                )}
              </Field>
            )}
          </Section>

          <Section title="Visibilitas">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="isActive" className="flex flex-col gap-0.5">
                <span className="text-sm/[17px] font-semibold text-ink-900">Tampil di katalog</span>
                <span className={fieldHint}>Nonaktif menyembunyikan tanpa menghapus</span>
              </label>
              <Switch
                id="isActive"
                checked={values.isActive}
                onCheckedChange={(checked) => set("isActive", checked)}
                className={largeSwitch}
              />
            </div>
          </Section>

          {product ? (
            <Section title="Zona berbahaya">
              <div className="flex flex-col gap-3 rounded-lg border border-error-border bg-error-soft p-4">
                <p className="text-[13px]/5 text-ink-800">
                  Produk yang sudah pernah dipesan tidak bisa dihapus permanen. Nonaktifkan agar riwayat dan laporan
                  tetap utuh.
                </p>
                <Button type="button" className={cn(dangerButton, "w-fit")} onClick={() => setDeleting(true)}>
                  <Trash2Icon />
                  Hapus produk
                </Button>
              </div>
            </Section>
          ) : (
            <p className="flex gap-2.5 rounded-lg bg-info-soft p-4 text-[13px]/5 text-info">
              <LightbulbIcon className="size-4 shrink-0" />
              Produk bekas dengan foto kondisi lengkap lebih cepat terjual.
            </p>
          )}
        </div>
      </div>

      {changes > 0 ? (
        <div className="sticky bottom-0 z-10 -mx-4 mt-auto -mb-8 flex items-center gap-3 bg-ink-900 px-4 py-3.5 md:-mx-8 md:-mb-12 md:px-8">
          <CircleAlertIcon className="size-[18px] shrink-0 text-accent-yellow" />
          <span className="flex-1 text-sm/[17px] font-medium text-white">
            Ada {changes} perubahan yang belum disimpan
          </span>
          <button
            type="button"
            className="text-sm/[17px] font-semibold text-ink-300 hover:text-white"
            onClick={() => {
              setValues(initial);
              setErrors({});
            }}
          >
            Buang
          </button>
          <Button
            type="submit"
            disabled={pending}
            className="h-8 gap-2 rounded-md bg-brand-600 px-3.5 text-[13px]/4 font-semibold text-white hover:bg-brand-700"
          >
            {pending ? <Spinner /> : null}
            Simpan
          </Button>
        </div>
      ) : null}

      {product ? (
        <DeleteProductDialog
          product={deleting ? product : null}
          onOpenChange={setDeleting}
          onDeleted={() => router.push("/admin/produk")}
        />
      ) : null}
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-0.5 border-b border-ink-200 pb-3">
        <h2 className="font-sans text-base/[19px] font-semibold text-ink-900">{title}</h2>
        {description ? <p className="text-[13px]/4 text-ink-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ProductFormSkeleton() {
  return (
    <div className="flex flex-col gap-7" aria-busy>
      <Skeleton className="h-12 w-64" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-[520px] rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </div>
  );
}
