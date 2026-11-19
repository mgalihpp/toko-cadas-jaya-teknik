"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  CheckIcon,
  FolderPlusIcon,
  InfoIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
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
import { DeleteProductDialog } from "./delete-product-dialog";
import { ProductImagesField } from "./product-images-field";
import { SpecsField } from "./specs-field";

const EMPTY_VALUES: ProductFormValues = {
  name: "",
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

const thousands = new Intl.NumberFormat("id-ID");

function formatPriceInput(raw: string) {
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits ? thousands.format(Number(digits)) : "";
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

  const isEdit = Boolean(product);
  const create = useMutation(trpc.admin.products.create.mutationOptions());
  const update = useMutation(trpc.admin.products.update.mutationOptions());
  const pending = create.isPending || update.isPending;

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

  const noCategories = categories.data?.length === 0;
  if (noCategories) {
    return (
      <EmptyState
        icon={FolderPlusIcon}
        title="Belum ada kategori"
        description="Buat kategori dulu sebelum menambahkan produk."
        action={
          <Button asChild>
            <Link href="/admin/kategori">Kelola kategori</Link>
          </Button>
        }
      />
    );
  }

  const slug = slugify(values.name);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button asChild variant="outline" size="icon" className="mt-1 shrink-0">
            <Link href="/admin/produk" aria-label="Kembali ke daftar produk">
              <ArrowLeftIcon />
            </Link>
          </Button>
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
              {isEdit ? "Edit Produk" : "Tambah Produk"}
            </h1>
            <p className="text-sm text-ink-500">
              {product
                ? `Terakhir diubah ${formatDateTime(product.updatedAt)}`
                : "Isi data lalu simpan, produk langsung tampil jika aktif"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="lg" className="flex-1 sm:flex-none">
            <Link href="/admin/produk">Batal</Link>
          </Button>
          <Button type="submit" size="lg" disabled={pending} className="flex-1 sm:flex-none">
            {pending ? <Spinner /> : <CheckIcon />}
            {isEdit ? "Simpan Perubahan" : "Simpan Produk"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <Section title="Informasi dasar">
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="name">Nama produk</FieldLabel>
              <Input
                id="name"
                className="h-10"
                placeholder="Contoh: Gerinda Tangan Makita 9553B"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? (
                <FieldError>{errors.name}</FieldError>
              ) : (
                <FieldDescription>
                  Slug URL: <span className="font-mono text-ink-700">/{slug || "..."}</span>
                  {isEdit ? null : ", dibuat otomatis dari nama"}
                </FieldDescription>
              )}
            </Field>

            <Field data-invalid={Boolean(errors.categoryId)}>
              <FieldLabel htmlFor="category">Kategori</FieldLabel>
              <NativeSelect
                id="category"
                className="w-full [&_select]:h-10"
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
              <FieldError>{errors.categoryId}</FieldError>
            </Field>

            <Field>
              <FieldLabel asChild>
                <span>Kondisi</span>
              </FieldLabel>
              <div role="radiogroup" aria-label="Kondisi" className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["baru", "Baru", "Unit baru bersegel"],
                    ["bekas", "Bekas", "Unit bekas, jelaskan kondisinya di deskripsi"],
                  ] as const
                ).map(([value, label, hint]) => {
                  const active = values.condition === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => set("condition", value)}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        active
                          ? "border-brand-500 bg-brand-50"
                          : "border-ink-200 bg-white hover:bg-ink-50"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                          active ? "border-brand-600" : "border-ink-300"
                        )}
                      >
                        {active ? <span className="size-2 rounded-full bg-brand-600" /> : null}
                      </span>
                      <span className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-ink-900">{label}</span>
                        <span className="text-xs text-ink-500">{hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field data-invalid={Boolean(errors.description)}>
              <FieldLabel htmlFor="description">Deskripsi</FieldLabel>
              <Textarea
                id="description"
                rows={5}
                placeholder="Jelaskan kegunaan, kelengkapan, dan garansi"
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
                aria-invalid={Boolean(errors.description)}
              />
              {errors.description ? (
                <FieldError>{errors.description}</FieldError>
              ) : (
                <FieldDescription>
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
            <FieldError>{errors.images}</FieldError>
          </Section>

          <Section title="Spesifikasi" description="Tampil sebagai tabel di halaman produk">
            <SpecsField rows={values.specs} onChange={(specs) => set("specs", specs)} />
            <FieldError>{errors.specs}</FieldError>
          </Section>
        </div>

        <div className="flex flex-col gap-6">
          <Section title="Harga dan stok">
            <Field data-invalid={Boolean(errors.price)}>
              <FieldLabel htmlFor="price">Harga jual</FieldLabel>
              <InputGroup className="h-10">
                <InputGroupAddon>
                  <InputGroupText>Rp</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="price"
                  inputMode="numeric"
                  placeholder="0"
                  value={values.price}
                  onChange={(e) => set("price", formatPriceInput(e.target.value))}
                  aria-invalid={Boolean(errors.price)}
                />
              </InputGroup>
              {errors.price ? (
                <FieldError>{errors.price}</FieldError>
              ) : isEdit ? (
                <FieldDescription>Pesanan lama tetap memakai harga saat dipesan</FieldDescription>
              ) : null}
            </Field>

            {product ? (
              <div className="flex flex-col gap-2">
                <dl className="grid grid-cols-3 divide-x divide-ink-200 rounded-lg border border-ink-200 text-center">
                  {(
                    [
                      ["Fisik", product.stockPhysical],
                      ["Terkunci", product.stockLocked],
                      ["Tersedia", product.stockPhysical - product.stockLocked],
                    ] as const
                  ).map(([label, n]) => (
                    <div key={label} className="flex flex-col gap-0.5 p-2">
                      <dt className="text-xs text-ink-500">{label}</dt>
                      <dd className="font-heading text-lg font-semibold text-ink-900 tabular-nums">{n}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-sm text-ink-500">
                  Ubah stok di halaman{" "}
                  <Link href="/admin/stok" className="font-medium text-brand-600 hover:underline">
                    Stok
                  </Link>
                </p>
              </div>
            ) : (
              <Field data-invalid={Boolean(errors.stock)}>
                <FieldLabel htmlFor="stock">Stok awal</FieldLabel>
                <Input
                  id="stock"
                  className="h-10"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={values.stock}
                  onChange={(e) => set("stock", e.target.value)}
                  aria-invalid={Boolean(errors.stock)}
                />
                {errors.stock ? (
                  <FieldError>{errors.stock}</FieldError>
                ) : (
                  <FieldDescription>Untuk barang bekas biasanya 1</FieldDescription>
                )}
              </Field>
            )}
          </Section>

          <Section title="Visibilitas">
            <Field orientation="horizontal">
              <div className="flex flex-1 flex-col gap-0.5">
                <FieldLabel htmlFor="isActive">Tampil di katalog</FieldLabel>
                <FieldDescription>Nonaktif menyembunyikan tanpa menghapus</FieldDescription>
              </div>
              <Switch
                id="isActive"
                checked={values.isActive}
                onCheckedChange={(checked) => set("isActive", checked)}
                className="data-checked:bg-success"
              />
            </Field>
            <p className="flex gap-2 rounded-lg border border-info-border bg-info-soft p-3 text-sm text-info">
              <InfoIcon className="mt-0.5 size-4 shrink-0" />
              Produk bekas dengan foto kondisi lengkap lebih cepat terjual.
            </p>
          </Section>

          {product ? (
            <section className="flex flex-col gap-3 rounded-xl border border-error-border bg-error-soft p-5">
              <h2 className="font-heading text-base font-semibold text-error">Zona berbahaya</h2>
              <p className="text-sm text-ink-700">
                Produk yang sudah pernah dipesan tidak bisa dihapus permanen. Nonaktifkan agar riwayat dan laporan tetap utuh.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-fit border-error-border text-error hover:bg-white hover:text-error"
                onClick={() => setDeleting(true)}
              >
                <Trash2Icon />
                Hapus produk
              </Button>
            </section>
          ) : null}
        </div>
      </div>

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
    <section className="flex flex-col gap-4 rounded-xl border border-ink-200 bg-white p-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-semibold text-ink-900">{title}</h2>
        {description ? <p className="text-sm text-ink-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ProductFormSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <Skeleton className="h-12 w-64" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-[520px] rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
