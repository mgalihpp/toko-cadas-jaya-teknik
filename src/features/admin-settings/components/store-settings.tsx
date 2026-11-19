"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2Icon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ErrorState, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/client";
import { MAX_BANK_ACCOUNTS, storeSettingsSchema, type StoreSettingsValues } from "../schemas";

type Errors = Record<string, string>;

export function StoreSettings() {
  const trpc = useTRPC();
  const settings = useQuery(trpc.settings.get.queryOptions());
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pengaturan Toko"
        description="Data ini tampil di checkout, detail pesanan, footer, dan halaman kontak"
      />
      {saved ? (
        <p className="flex items-center gap-2 rounded-xl border border-success-border bg-success-soft px-4 py-3 text-sm font-medium text-success">
          <CheckCircle2Icon className="size-4 shrink-0" />
          Perubahan disimpan. Halaman kontak dan checkout sudah memakai data terbaru.
        </p>
      ) : null}
      {settings.isError ? (
        <ErrorState onRetry={() => settings.refetch()} />
      ) : settings.isPending ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : (
        <SettingsForm
          key={settings.data.updatedAt.getTime()}
          initial={{
            bankAccounts: settings.data.bankAccounts,
            address: settings.data.address,
            phone: settings.data.phone,
            openingHours: settings.data.openingHours,
          }}
          onDirty={() => setSaved(false)}
          onSaved={() => setSaved(true)}
        />
      )}
    </div>
  );
}

function SettingsForm({
  initial,
  onDirty,
  onSaved,
}: {
  initial: StoreSettingsValues;
  onDirty: () => void;
  onSaved: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<StoreSettingsValues>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const update = useMutation(
    trpc.settings.update.mutationOptions({
      onSuccess: async () => {
        toast.success("Pengaturan toko disimpan");
        onSaved();
        await queryClient.invalidateQueries({ queryKey: trpc.settings.get.queryKey() });
      },
      onError: (error) => toast.error(error.message || "Gagal menyimpan pengaturan"),
    })
  );

  function patch(next: Partial<StoreSettingsValues>) {
    setValues((v) => ({ ...v, ...next }));
    onDirty();
  }

  function patchAccount(index: number, field: keyof StoreSettingsValues["bankAccounts"][number], value: string) {
    patch({
      bankAccounts: values.bankAccounts.map((a, i) => (i === index ? { ...a, [field]: value } : a)),
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = storeSettingsSchema.safeParse(values);
    if (!result.success) {
      const next: Errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".");
        next[key] ??= issue.message;
      }
      setErrors(next);
      toast.error("Periksa kembali isian yang ditandai");
      return;
    }
    setErrors({});
    update.mutate(result.data);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
      <Section
        title="Rekening transfer"
        description="Tampil di checkout dan halaman detail pesanan pelanggan"
      >
        {values.bankAccounts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-300 px-4 py-6 text-center text-sm text-ink-500">
            Belum ada rekening. Pelanggan tidak dapat membayar dengan transfer sampai rekening
            ditambahkan.
          </p>
        ) : null}
        {values.bankAccounts.map((account, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-xl border border-ink-200 p-4 sm:grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start"
          >
            <TextField
              id={`bank-${index}`}
              label="Bank"
              value={account.bank}
              placeholder="BCA"
              error={errors[`bankAccounts.${index}.bank`]}
              onChange={(v) => patchAccount(index, "bank", v)}
            />
            <TextField
              id={`number-${index}`}
              label="Nomor rekening"
              value={account.number}
              placeholder="5270 8812 34"
              inputMode="numeric"
              error={errors[`bankAccounts.${index}.number`]}
              onChange={(v) => patchAccount(index, "number", v)}
            />
            <TextField
              id={`holder-${index}`}
              label="Atas nama"
              value={account.holder}
              placeholder="Budi Santoso"
              error={errors[`bankAccounts.${index}.holder`]}
              onChange={(v) => patchAccount(index, "holder", v)}
            />
            <Button
              type="button"
              variant="ghost"
              className="text-error hover:bg-error-soft hover:text-error sm:mt-6"
              onClick={() => patch({ bankAccounts: values.bankAccounts.filter((_, i) => i !== index) })}
              aria-label={`Hapus rekening ${account.bank || index + 1}`}
            >
              <Trash2Icon />
              <span className="sm:sr-only">Hapus</span>
            </Button>
          </div>
        ))}
        {errors.bankAccounts ? <FieldError>{errors.bankAccounts}</FieldError> : null}
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          disabled={values.bankAccounts.length >= MAX_BANK_ACCOUNTS}
          onClick={() =>
            patch({ bankAccounts: [...values.bankAccounts, { bank: "", number: "", holder: "" }] })
          }
        >
          <PlusIcon />
          Tambah rekening
        </Button>
      </Section>

      <Section title="Informasi kontak" description="Tampil di footer dan halaman kontak">
        <TextField
          id="phone"
          label="Telepon atau WhatsApp"
          value={values.phone}
          placeholder="0812 3456 7890"
          inputMode="tel"
          error={errors.phone}
          onChange={(v) => patch({ phone: v })}
        />
        <Field data-invalid={Boolean(errors.address)}>
          <FieldLabel htmlFor="address">Alamat toko</FieldLabel>
          <Textarea
            id="address"
            value={values.address}
            onChange={(e) => patch({ address: e.target.value })}
            rows={3}
            maxLength={500}
            aria-invalid={Boolean(errors.address)}
          />
          {errors.address ? <FieldError>{errors.address}</FieldError> : null}
        </Field>
      </Section>

      <Section
        title="Jam operasional"
        description="Tulis satu baris per hari atau rentang hari, misalnya Senin sampai Jumat 08.00 sampai 17.00"
      >
        <Field data-invalid={Boolean(errors.openingHours)}>
          <FieldLabel htmlFor="opening-hours" className="sr-only">
            Jam operasional
          </FieldLabel>
          <Textarea
            id="opening-hours"
            value={values.openingHours}
            onChange={(e) => patch({ openingHours: e.target.value })}
            rows={4}
            maxLength={300}
            placeholder={"Senin sampai Kamis 08.00 sampai 17.00\nJumat 08.00 sampai 17.00\nSabtu 08.00 sampai 15.00\nMinggu tutup"}
            aria-invalid={Boolean(errors.openingHours)}
          />
          {errors.openingHours ? <FieldError>{errors.openingHours}</FieldError> : null}
        </Field>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex justify-end border-t border-ink-200 bg-white/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Button type="submit" disabled={update.isPending} className="w-full sm:w-auto">
          {update.isPending ? <Spinner /> : <SaveIcon />}
          Simpan perubahan
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 rounded-2xl border border-ink-200 bg-white p-4 sm:p-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-semibold text-ink-900">{title}</h2>
        <p className="text-[13px] text-ink-500">{description}</p>
      </div>
      <div className="flex min-w-0 flex-col gap-3">{children}</div>
    </section>
  );
}

function TextField({
  id,
  label,
  value,
  placeholder,
  error,
  inputMode,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  onChange: (value: string) => void;
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
