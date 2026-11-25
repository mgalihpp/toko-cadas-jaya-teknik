"use client";

import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon,
  CircleCheckIcon,
  ClockIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { DAYS, parseWeek, serializeWeek, type Day, type WeekHours } from "../hours";
import { MAX_BANK_ACCOUNTS, storeSettingsSchema, type StoreSettingsValues } from "../schemas";

type Errors = Record<string, string>;
type BankAccount = StoreSettingsValues["bankAccounts"][number];

const FORM_ID = "store-settings-form";

const BANK_COLORS: Record<string, string> = {
  BCA: "#1D4ED8",
  BRI: "#0B4EA2",
};

const box =
  "flex gap-2 rounded-[8px] border border-ink-300 bg-white px-3 py-3 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20";
const boxControl =
  "w-full min-w-0 bg-transparent text-sm leading-4 text-ink-900 outline-none placeholder:text-ink-500";
const labelText = "text-[13px] leading-4 font-semibold text-ink-900";

function SaveButton({ pending, disabled, className }: { pending: boolean; disabled?: boolean; className?: string }) {
  return (
    <Button
      type="submit"
      form={FORM_ID}
      disabled={pending || disabled}
      className={cn(
        "h-auto gap-2 rounded-[8px] bg-brand-600 px-4 py-[9px] text-sm leading-[17px] font-semibold text-white hover:bg-brand-700",
        className
      )}
    >
      {pending ? <Spinner /> : <CheckIcon />}
      Simpan
    </Button>
  );
}

export function StoreSettings() {
  const trpc = useTRPC();
  const settings = useQuery(trpc.settings.get.queryOptions());
  const pending = useIsMutating({ mutationKey: trpc.settings.update.mutationKey() }) > 0;
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold tracking-[-0.6px] text-ink-900 sm:text-[26px] sm:leading-[33px]">
          Pengaturan Toko
        </h1>
        <SaveButton pending={pending} disabled={!settings.data} className="max-sm:hidden" />
      </div>
      {saved ? (
        <div className="flex items-center gap-2.5 rounded-[10px] border border-success-border bg-success-soft px-4 py-[11px] text-success">
          <CircleCheckIcon className="size-[18px] shrink-0" />
          <p className="flex-1 text-sm leading-[17px] font-medium">
            Perubahan disimpan. Halaman kontak dan checkout sudah memakai data terbaru.
          </p>
          <button
            type="button"
            aria-label="Tutup pemberitahuan"
            onClick={() => setSaved(false)}
            className="shrink-0 rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      ) : null}
      {settings.isError ? (
        <ErrorState onRetry={() => settings.refetch()} />
      ) : settings.isPending ? (
        <div className="flex flex-col gap-7">
          <Skeleton className="h-52 rounded-[12px]" />
          <Skeleton className="h-36 rounded-[12px]" />
        </div>
      ) : (
        <SettingsForm
          key={settings.data.updatedAt.getTime()}
          initial={{
            bankAccounts: settings.data.bankAccounts,
            address: settings.data.address,
            phone: settings.data.phone,
            email: settings.data.email,
            paymentWindowHours: settings.data.paymentWindowHours,
            openingHours: settings.data.openingHours,
          }}
          pending={pending}
          onDirty={() => setSaved(false)}
          onSaved={() => setSaved(true)}
        />
      )}
    </div>
  );
}

function SettingsForm({
  initial,
  pending,
  onDirty,
  onSaved,
}: {
  initial: StoreSettingsValues;
  pending: boolean;
  onDirty: () => void;
  onSaved: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<StoreSettingsValues>(initial);
  const [editing, setEditing] = useState<boolean[]>(() => initial.bankAccounts.map(() => false));
  const [errors, setErrors] = useState<Errors>({});
  const [week, setWeek] = useState<WeekHours>(() => parseWeek(initial.openingHours));
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

  function setPrimary(index: number) {
    patch({
      bankAccounts: values.bankAccounts.map((a, i) => ({ ...a, primary: i === index ? true : undefined })),
    });
  }

  function patchDay(day: Day, next: Partial<WeekHours[Day]>) {
    const updated = { ...week, [day]: { ...week[day], ...next } };
    setWeek(updated);
    patch({ openingHours: serializeWeek(updated) });
  }

  function patchAccount(index: number, field: "bank" | "number" | "holder", value: string) {
    patch({
      bankAccounts: values.bankAccounts.map((a, i) => (i === index ? { ...a, [field]: value } : a)),
    });
  }

  function setEditingAt(index: number, open: boolean) {
    setEditing((e) => e.map((v, i) => (i === index ? open : v)));
  }

  function removeAccount(index: number) {
    patch({ bankAccounts: values.bankAccounts.filter((_, i) => i !== index) });
    setEditing((e) => e.filter((_, i) => i !== index));
    setErrors({});
  }

  function addAccount() {
    patch({ bankAccounts: [...values.bankAccounts, { bank: "", number: "", holder: "" }] });
    setEditing((e) => [...e, true]);
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
    const accounts = result.data.bankAccounts;
    const primaryFirst = [...accounts.filter((a) => a.primary), ...accounts.filter((a) => !a.primary)];
    update.mutate({ ...result.data, bankAccounts: primaryFirst });
  }

  const accountHasError = (index: number) =>
    Object.keys(errors).some((key) => key.startsWith(`bankAccounts.${index}.`));

  return (
    <form id={FORM_ID} onSubmit={submit} className="flex flex-col gap-7" noValidate>
      <Section
        title="Rekening transfer"
        description="Tampil di checkout dan halaman detail pesanan pelanggan"
      >
        {values.bankAccounts.length === 0 ? (
          <p className="rounded-[12px] border border-dashed border-ink-300 px-4 py-6 text-center text-sm text-ink-500">
            Belum ada rekening. Pelanggan tidak dapat membayar dengan transfer sampai rekening
            ditambahkan.
          </p>
        ) : null}
        {values.bankAccounts.map((account, index) =>
          editing[index] || accountHasError(index) ? (
            <BankAccountEditor
              key={index}
              index={index}
              account={account}
              errors={errors}
              onChange={(field, value) => patchAccount(index, field, value)}
              onDone={() => setEditingAt(index, false)}
              onRemove={() => removeAccount(index)}
            />
          ) : (
            <BankAccountRow
              key={index}
              account={account}
              onEdit={() => setEditingAt(index, true)}
              onPrimary={() => setPrimary(index)}
            />
          )
        )}
        {errors.bankAccounts ? <FieldError>{errors.bankAccounts}</FieldError> : null}
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-fit gap-2 rounded-[8px] px-4 py-[9px] text-sm leading-[17px] font-semibold text-brand-700 hover:bg-brand-50 hover:text-brand-700"
          disabled={values.bankAccounts.length >= MAX_BANK_ACCOUNTS}
          onClick={addAccount}
        >
          <PlusIcon />
          Tambah rekening
        </Button>
      </Section>

      <Section title="Informasi kontak" description="Tampil di footer dan halaman kontak">
        <Field data-invalid={Boolean(errors.address)} className="gap-1.5">
          <FieldLabel htmlFor="address" className={labelText}>
            Alamat toko
          </FieldLabel>
          <div className={cn(box, "items-start")}>
            <MapPinIcon className="size-4 shrink-0 text-ink-500" />
            <textarea
              id="address"
              value={values.address}
              onChange={(e) => patch({ address: e.target.value })}
              rows={1}
              maxLength={500}
              aria-invalid={Boolean(errors.address)}
              className={cn(boxControl, "field-sizing-content resize-none")}
            />
          </div>
          {errors.address ? <FieldError>{errors.address}</FieldError> : null}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.phone)} className="gap-1.5">
            <FieldLabel htmlFor="phone" className={labelText}>
              Telepon atau WhatsApp
            </FieldLabel>
            <div className={cn(box, "items-center")}>
              <PhoneIcon className="size-4 shrink-0 text-ink-500" />
              <input
                id="phone"
                value={values.phone}
                placeholder="0812 3456 7890"
                inputMode="tel"
                aria-invalid={Boolean(errors.phone)}
                onChange={(e) => patch({ phone: e.target.value })}
                className={boxControl}
              />
            </div>
            {errors.phone ? <FieldError>{errors.phone}</FieldError> : null}
          </Field>
          <Field data-invalid={Boolean(errors.email)} className="gap-1.5">
            <FieldLabel htmlFor="email" className={labelText}>
              Email
            </FieldLabel>
            <div className={cn(box, "items-center")}>
              <MailIcon className="size-4 shrink-0 text-ink-500" />
              <input
                id="email"
                type="email"
                value={values.email}
                placeholder="toko@contoh.com"
                aria-invalid={Boolean(errors.email)}
                onChange={(e) => patch({ email: e.target.value })}
                className={boxControl}
              />
            </div>
            {errors.email ? <FieldError>{errors.email}</FieldError> : null}
          </Field>
        </div>
      </Section>

      <Section title="Jam operasional" description="Aktifkan hari buka dan atur jamnya. Tampil di halaman kontak">
        <div className="flex flex-col divide-y divide-ink-200 rounded-[12px] border border-ink-200">
          {DAYS.map((day) => {
            const h = week[day];
            return (
              <div key={day} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <Switch
                  checked={h.open}
                  onCheckedChange={(open) => patchDay(day, { open })}
                  aria-label={`${day} buka`}
                />
                <span className="w-16 text-sm leading-[17px] font-semibold text-ink-900">{day}</span>
                {h.open ? (
                  <div className="flex items-center gap-2 text-sm text-ink-600">
                    <input
                      type="time"
                      value={h.from}
                      aria-label={`${day} jam buka`}
                      onChange={(e) => patchDay(day, { from: e.target.value })}
                      className="h-9 rounded-[8px] border border-ink-300 bg-white px-2 text-sm text-ink-900 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                    <span>sampai</span>
                    <input
                      type="time"
                      value={h.to}
                      aria-label={`${day} jam tutup`}
                      onChange={(e) => patchDay(day, { to: e.target.value })}
                      className="h-9 rounded-[8px] border border-ink-300 bg-white px-2 text-sm text-ink-900 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-ink-500">Tutup</span>
                )}
              </div>
            );
          })}
        </div>
        {errors.openingHours ? <FieldError>{errors.openingHours}</FieldError> : null}
      </Section>

      <Section
        title="Pembayaran"
        description="Batas waktu pelanggan mengunggah bukti transfer. Pesanan yang lewat batas dibatalkan otomatis"
      >
        <Field data-invalid={Boolean(errors.paymentWindowHours)} className="max-w-60 gap-1.5">
          <FieldLabel htmlFor="payment-window" className={labelText}>
            Batas waktu pembayaran
          </FieldLabel>
          <div className={cn(box, "items-center")}>
            <ClockIcon className="size-4 shrink-0 text-ink-500" />
            <input
              id="payment-window"
              type="number"
              min={1}
              max={168}
              inputMode="numeric"
              value={Number.isNaN(values.paymentWindowHours) ? "" : values.paymentWindowHours}
              aria-invalid={Boolean(errors.paymentWindowHours)}
              onChange={(e) => patch({ paymentWindowHours: e.target.valueAsNumber })}
              className={boxControl}
            />
            <span className="text-sm text-ink-500">jam</span>
          </div>
          {errors.paymentWindowHours ? <FieldError>{errors.paymentWindowHours}</FieldError> : null}
        </Field>
      </Section>

      <div className="sticky bottom-0 -mx-4 border-t border-ink-200 bg-white/90 px-4 py-3 backdrop-blur sm:hidden">
        <SaveButton pending={pending} className="w-full" />
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
    <section className="grid gap-4 border-b border-ink-200 pb-7 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12">
      <div className="flex flex-col gap-1">
        <h2 className="font-sans text-base leading-[19px] font-semibold text-ink-900">{title}</h2>
        <p className="text-[13px] leading-[1.5] text-ink-500">{description}</p>
      </div>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </section>
  );
}

function BankLogo({ bank }: { bank: string }) {
  const name = bank.trim().toUpperCase();
  return (
    <span
      aria-hidden
      className="flex h-9 w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[6px] px-1 text-xs leading-[15px] font-extrabold text-white"
      style={{ backgroundColor: BANK_COLORS[name] ?? "var(--color-ink-700)" }}
    >
      {name.slice(0, 7)}
    </span>
  );
}

function BankAccountRow({
  account,
  onEdit,
  onPrimary,
}: {
  account: BankAccount;
  onEdit: () => void;
  onPrimary: () => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[12px] border border-ink-200 p-[15px]">
      <BankLogo bank={account.bank} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-[ui-monospace,SFMono-Regular,Menlo,Consolas,monospace] text-[15px] leading-5 font-semibold text-ink-900">
          {account.number}
        </span>
        <span className="truncate text-[13px] leading-4 text-ink-600">a.n. {account.holder}</span>
      </div>
      {account.primary ? (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs leading-[15px] font-semibold text-brand-700">
          <StarIcon className="size-3 fill-current" />
          Utama
        </span>
      ) : (
        <button
          type="button"
          onClick={onPrimary}
          className="shrink-0 rounded-[6px] px-2.5 py-1 text-xs leading-[15px] font-semibold text-ink-600 outline-none hover:bg-ink-100 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Jadikan utama
        </button>
      )}
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Ubah rekening ${account.bank}`}
        className="flex size-8 shrink-0 items-center justify-center rounded-[6px] text-ink-600 outline-none hover:bg-ink-100 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <PencilIcon className="size-[15px]" />
      </button>
    </div>
  );
}

function BankAccountEditor({
  index,
  account,
  errors,
  onChange,
  onDone,
  onRemove,
}: {
  index: number;
  account: BankAccount;
  errors: Errors;
  onChange: (field: "bank" | "number" | "holder", value: string) => void;
  onDone: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-[12px] border border-ink-200 p-4 sm:grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start">
      <TextField
        id={`bank-${index}`}
        label="Bank"
        value={account.bank}
        placeholder="BCA"
        error={errors[`bankAccounts.${index}.bank`]}
        onChange={(v) => onChange("bank", v)}
      />
      <TextField
        id={`number-${index}`}
        label="Nomor rekening"
        value={account.number}
        placeholder="5270 8812 34"
        inputMode="numeric"
        error={errors[`bankAccounts.${index}.number`]}
        onChange={(v) => onChange("number", v)}
      />
      <TextField
        id={`holder-${index}`}
        label="Atas nama"
        value={account.holder}
        placeholder="Budi Santoso"
        error={errors[`bankAccounts.${index}.holder`]}
        onChange={(v) => onChange("holder", v)}
      />
      <div className="flex gap-1 sm:mt-[22px]">
        <Button
          type="button"
          variant="ghost"
          className="h-[42px] text-error hover:bg-error-soft hover:text-error"
          onClick={onRemove}
          aria-label={`Hapus rekening ${account.bank || index + 1}`}
        >
          <Trash2Icon />
          <span className="sm:sr-only">Hapus</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-[42px] text-ink-600"
          onClick={onDone}
          aria-label={`Selesai mengubah rekening ${account.bank || index + 1}`}
        >
          <CheckIcon />
          <span className="sm:sr-only">Selesai</span>
        </Button>
      </div>
    </div>
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
    <Field data-invalid={Boolean(error)} className="gap-1.5">
      <FieldLabel htmlFor={id} className={labelText}>
        {label}
      </FieldLabel>
      <div className={cn(box, "items-center")}>
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          aria-invalid={Boolean(error)}
          onChange={(e) => onChange(e.target.value)}
          className={boxControl}
        />
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
