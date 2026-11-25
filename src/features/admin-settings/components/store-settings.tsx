"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ClockIcon, MapPinIcon, MinusIcon, PhoneIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/layout";
import { MButton } from "@/components/mobile/m-button";
import { BottomSheet, SheetClose, SheetRoot } from "@/components/mobile/sheet";
import { StickyBar } from "@/components/mobile/sticky-bar";
import { ErrorState } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { DAYS, parseWeek, serializeWeek, summarizeWeek, type WeekHours } from "../hours";
import { MAX_BANK_ACCOUNTS, storeSettingsSchema, type StoreSettingsValues } from "../schemas";

type Errors = Record<string, string | undefined>;

const box = (bad?: boolean, focused?: boolean) =>
  cn(
    "w-full rounded-[10px] bg-white px-3 text-[15px] text-ink-900 outline-none placeholder:text-ink-500",
    bad ? "border-2 border-error" : focused ? "border-2 border-brand-600" : "border-[1.5px] border-ink-200 focus:border-2 focus:border-brand-600",
  );

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-ink-900">{label}</span>
      {children}
      {error ? <p className="text-xs font-medium text-error">{error}</p> : null}
    </div>
  );
}

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

export function StoreSettings() {
  const trpc = useTRPC();
  const settings = useQuery(trpc.settings.get.queryOptions());

  if (settings.isError) {
    return (
      <div className="flex flex-1 flex-col">
        <AdminHeader title="Pengaturan toko" backHref="/admin" />
        <ErrorState onRetry={() => settings.refetch()} />
      </div>
    );
  }
  if (settings.isPending) {
    return (
      <div className="flex flex-1 flex-col">
        <AdminHeader title="Pengaturan toko" backHref="/admin" />
        <div role="status" className="flex flex-col gap-1.5">
          <Skeleton className="h-52 rounded-none" />
          <Skeleton className="h-52 rounded-none" />
        </div>
      </div>
    );
  }
  return (
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
    />
  );
}

function SettingsForm({ initial }: { initial: StoreSettingsValues }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<StoreSettingsValues>({
    ...initial,
    bankAccounts: initial.bankAccounts.length ? initial.bankAccounts : [{ bank: "", number: "", holder: "" }],
  });
  const [errors, setErrors] = useState<Errors>({});
  const [week, setWeek] = useState<WeekHours>(() => parseWeek(initial.openingHours));
  const [hoursOpen, setHoursOpen] = useState(false);

  const update = useMutation(
    trpc.settings.update.mutationOptions({
      onSuccess: async () => {
        toast.success("Pengaturan disimpan");
        await queryClient.invalidateQueries({ queryKey: trpc.settings.get.queryKey() });
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  function patch(changes: Partial<StoreSettingsValues>) {
    setValues((v) => ({ ...v, ...changes }));
    setErrors({});
  }

  function setAccount(index: number, field: "bank" | "number" | "holder", value: string) {
    patch({ bankAccounts: values.bankAccounts.map((a, i) => (i === index ? { ...a, [field]: value } : a)) });
  }

  function submit() {
    const accounts = values.bankAccounts.filter((a) => a.bank.trim() || a.number.trim() || a.holder.trim());
    const result = storeSettingsSchema.safeParse({ ...values, bankAccounts: accounts, openingHours: values.openingHours });
    if (!result.success) {
      const next: Errors = {};
      for (const issue of result.error.issues) next[issue.path.join(".")] ??= issue.message;
      setErrors(next);
      return;
    }
    update.mutate(result.data);
  }

  const summary = values.openingHours ? summarizeWeek(parseWeek(values.openingHours)) : null;
  const stepBtn = "flex size-[34px] items-center justify-center text-brand-700 disabled:text-ink-300";

  return (
    <div className="flex flex-1 flex-col pb-[76px]">
      <AdminHeader title="Pengaturan toko" backHref="/admin" />

      <Section title="Rekening tujuan transfer">
        {values.bankAccounts.map((account, index) => (
          <div key={index} className="flex flex-col gap-3">
            {index > 0 ? (
              <div className="flex items-center">
                <p className="flex-1 text-[13px] font-bold text-ink-500">Rekening {index + 1}</p>
                <button
                  type="button"
                  aria-label={`Hapus rekening ${index + 1}`}
                  onClick={() => patch({ bankAccounts: values.bankAccounts.filter((_, i) => i !== index) })}
                  className="text-error"
                >
                  <Trash2Icon className="size-[18px]" />
                </button>
              </div>
            ) : null}
            <Field label="Nama bank" error={errors[`bankAccounts.${index}.bank`]}>
              <input
                className={cn(box(Boolean(errors[`bankAccounts.${index}.bank`])), "h-12")}
                value={account.bank}
                placeholder="Contoh: BCA"
                onChange={(e) => setAccount(index, "bank", e.target.value)}
              />
            </Field>
            <Field label="Nomor rekening" error={errors[`bankAccounts.${index}.number`]}>
              <input
                inputMode="numeric"
                className={cn(box(Boolean(errors[`bankAccounts.${index}.number`])), "h-12")}
                value={account.number}
                onChange={(e) => setAccount(index, "number", e.target.value)}
              />
            </Field>
            <Field label="Atas nama" error={errors[`bankAccounts.${index}.holder`]}>
              <input
                className={cn(box(Boolean(errors[`bankAccounts.${index}.holder`])), "h-12")}
                value={account.holder}
                onChange={(e) => setAccount(index, "holder", e.target.value)}
              />
            </Field>
          </div>
        ))}
        {values.bankAccounts.length < MAX_BANK_ACCOUNTS ? (
          <button
            type="button"
            onClick={() => patch({ bankAccounts: [...values.bankAccounts, { bank: "", number: "", holder: "" }] })}
            className="flex items-center gap-1.5 self-start text-[13px] font-bold text-brand-600"
          >
            <PlusIcon className="size-4" />
            Tambah rekening
          </button>
        ) : null}
        {errors.bankAccounts ? <p className="text-xs font-medium text-error">{errors.bankAccounts}</p> : null}
      </Section>

      <Section title="Kontak dan lokasi">
        <Field label="Alamat toko" error={errors.address}>
          <div className={cn(box(Boolean(errors.address)), "flex items-start gap-2 py-3")}>
            <MapPinIcon className="mt-0.5 size-5 shrink-0 text-ink-500" strokeWidth={1.8} />
            <textarea
              rows={2}
              className="min-w-0 flex-1 resize-none bg-transparent outline-none placeholder:text-ink-500"
              value={values.address}
              onChange={(e) => patch({ address: e.target.value })}
            />
          </div>
        </Field>
        <Field label="Telepon" error={errors.phone}>
          <div className={cn(box(Boolean(errors.phone)), "flex h-12 items-center gap-2")}>
            <PhoneIcon className="size-5 shrink-0 text-ink-500" strokeWidth={1.8} />
            <input
              type="tel"
              inputMode="tel"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-500"
              value={values.phone}
              onChange={(e) => patch({ phone: e.target.value })}
            />
          </div>
        </Field>
        <Field label="Jam operasional" error={errors.openingHours}>
          <button
            type="button"
            onClick={() => setHoursOpen(true)}
            className={cn(box(Boolean(errors.openingHours)), "flex h-12 items-center gap-2 text-left")}
          >
            <ClockIcon className="size-5 shrink-0 text-ink-500" strokeWidth={1.8} />
            <span className="min-w-0 flex-1 truncate">{summary?.open || "Atur jam operasional"}</span>
          </button>
        </Field>
      </Section>

      <section className="flex flex-col gap-2.5 bg-white p-3">
        <h2 className="text-[15px] font-bold text-ink-900">Batas bayar pesanan transfer</h2>
        <div className="flex items-center gap-2">
          <p className="text-sm text-ink-500">Batalkan otomatis setelah</p>
          <div className="flex h-9 items-center overflow-hidden rounded-lg border-[1.5px] border-ink-200">
            <button
              type="button"
              aria-label="Kurangi jam"
              className={stepBtn}
              disabled={values.paymentWindowHours <= 1}
              onClick={() => patch({ paymentWindowHours: values.paymentWindowHours - 1 })}
            >
              <MinusIcon className="size-[18px]" strokeWidth={2} />
            </button>
            <span className="w-10 text-center text-[15px] font-bold text-ink-900" aria-live="polite">
              {values.paymentWindowHours}
            </span>
            <button
              type="button"
              aria-label="Tambah jam"
              className={stepBtn}
              disabled={values.paymentWindowHours >= 168}
              onClick={() => patch({ paymentWindowHours: values.paymentWindowHours + 1 })}
            >
              <PlusIcon className="size-[18px]" strokeWidth={2} />
            </button>
          </div>
          <p className="text-sm font-medium text-ink-900">jam</p>
        </div>
        {errors.paymentWindowHours ? <p className="text-xs font-medium text-error">{errors.paymentWindowHours}</p> : null}
        <p className="text-xs text-ink-500">Usulan awal 24 jam. Sesuaikan dengan kebiasaan toko.</p>
      </section>

      <StickyBar>
        <MButton size="lg" block loading={update.isPending} onClick={submit}>
          <CheckIcon className="size-[18px]" />
          Simpan pengaturan
        </MButton>
      </StickyBar>

      <SheetRoot open={hoursOpen} onOpenChange={setHoursOpen}>
        <BottomSheet title="Jam operasional">
          <div className="flex h-12 items-center gap-1 pr-2 pl-4">
            <p className="flex-1 text-[17px] font-bold text-ink-900">Jam operasional</p>
            <SheetClose aria-label="Tutup" className="flex size-10 items-center justify-center rounded-full text-ink-500">
              <XIcon className="size-6" strokeWidth={1.8} />
            </SheetClose>
          </div>
          <div className="flex flex-col overflow-y-auto px-4">
            {DAYS.map((day) => {
              const h = week[day];
              const set = (next: Partial<typeof h>) => setWeek((w) => ({ ...w, [day]: { ...w[day], ...next } }));
              return (
                <div key={day} className="flex items-center gap-2 border-b border-ink-200 py-2.5 last:border-b-0">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={h.open}
                    aria-label={`${day} buka`}
                    onClick={() => set({ open: !h.open })}
                    className={cn("relative h-[26px] w-11 shrink-0 rounded-full", h.open ? "bg-brand-600" : "bg-ink-300")}
                  >
                    <span
                      className={cn(
                        "absolute top-[3px] size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.3)] transition-all",
                        h.open ? "left-[21px]" : "left-[3px]",
                      )}
                    />
                  </button>
                  <p className="w-14 text-sm font-medium text-ink-900">{day}</p>
                  {h.open ? (
                    <div className="flex flex-1 items-center gap-1.5">
                      <input
                        type="time"
                        aria-label={`${day} jam buka`}
                        value={h.from}
                        onChange={(e) => set({ from: e.target.value })}
                        className="h-10 min-w-0 flex-1 rounded-lg border-[1.5px] border-ink-200 px-2 text-sm"
                      />
                      <span className="text-ink-500">–</span>
                      <input
                        type="time"
                        aria-label={`${day} jam tutup`}
                        value={h.to}
                        onChange={(e) => set({ to: e.target.value })}
                        className="h-10 min-w-0 flex-1 rounded-lg border-[1.5px] border-ink-200 px-2 text-sm"
                      />
                    </div>
                  ) : (
                    <p className="flex-1 text-sm text-ink-500">Tutup</p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-2.5 border-t border-ink-200 px-4 pt-2.5 pb-[18px]">
            <MButton
              size="lg"
              block
              onClick={() => {
                patch({ openingHours: serializeWeek(week) });
                setHoursOpen(false);
              }}
            >
              Terapkan
            </MButton>
          </div>
        </BottomSheet>
      </SheetRoot>
    </div>
  );
}
