"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  EqualIcon,
  MinusIcon,
  PackageIcon,
  PlusIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import {
  ADJUST_MODES,
  ADJUST_MODE_LABEL,
  LOW_STOCK,
  REASONS,
  adjustStockSchema,
  computeNewPhysical,
  type AdjustMode,
} from "../schemas";

type StockProduct = {
  id: string;
  name: string;
  condition: "baru" | "bekas";
  stockPhysical: number;
  stockLocked: number;
  imageUrl: string | undefined;
};

const MODE_ICON: Record<AdjustMode, { icon: LucideIcon; activeTone: string }> = {
  tambah: { icon: PlusIcon, activeTone: "text-success" },
  kurangi: { icon: MinusIcon, activeTone: "text-error" },
  atur: { icon: EqualIcon, activeTone: "text-ink-900" },
};

const labelClass = "text-[13px] leading-4 font-semibold text-ink-900";
const hintClass = "text-xs leading-[15px] text-ink-500";

function availableTone(n: number) {
  if (n <= 0) return "text-error";
  if (n <= LOW_STOCK) return "text-warning";
  return "text-ink-900";
}

export function AdjustStockPage({ productId }: { productId: string }) {
  const trpc = useTRPC();
  const product = useQuery(trpc.admin.products.byId.queryOptions({ id: productId }));

  if (product.isError) {
    return (
      <div className="flex flex-col gap-6">
        <BackHeader />
        <ErrorState description={product.error.message} onRetry={() => product.refetch()} />
      </div>
    );
  }
  if (!product.data) {
    return (
      <div className="flex flex-col gap-6">
        <BackHeader />
        <Skeleton className="h-[88px] w-full rounded-[12px]" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }
  const p = product.data;
  return (
    <AdjustForm
      key={p.id}
      product={{
        id: p.id,
        name: p.name,
        condition: p.condition,
        stockPhysical: p.stockPhysical,
        stockLocked: p.stockLocked,
        imageUrl: p.images[0]?.url,
      }}
    />
  );
}

function BackHeader({ actions }: { actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3.5">
        <Button
          asChild
          variant="outline"
          className="size-9 shrink-0 rounded-[8px] border-ink-200 p-0 text-ink-700"
        >
          <Link href="/admin/stok" aria-label="Kembali ke daftar stok">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <h1 className="font-heading text-[26px] leading-[33px] font-bold tracking-[-0.6px] text-ink-900">
          Sesuaikan Stok
        </h1>
      </div>
      {actions}
    </div>
  );
}

type Errors = Partial<Record<"amount" | "reason" | "note", string>>;

function AdjustForm({ product }: { product: StockProduct }) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AdjustMode>("tambah");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const fieldId = useId();
  const available = product.stockPhysical - product.stockLocked;

  const adjust = useMutation(
    trpc.admin.stock.adjust.mutationOptions({
      onSuccess: async () => {
        toast.success("Stok diperbarui");
        setMode("tambah");
        setAmount("");
        setReason("");
        setNote("");
        await Promise.all([
          queryClient.invalidateQueries(trpc.admin.stock.pathFilter()),
          queryClient.invalidateQueries(trpc.admin.products.pathFilter()),
          queryClient.invalidateQueries(trpc.admin.finance.dashboard.pathFilter()),
          queryClient.invalidateQueries(trpc.catalog.pathFilter()),
        ]);
        router.push("/admin/stok");
      },
      onError: (error) => setErrors({ amount: error.message }),
    })
  );

  const amountNum = Number(amount);
  const newPhysical =
    amount.trim() && Number.isInteger(amountNum) && amountNum >= 0
      ? computeNewPhysical(mode, product.stockPhysical, amountNum)
      : null;
  const newAvailable = newPhysical === null ? null : newPhysical - product.stockLocked;

  function changeAmount(next: string) {
    setAmount(next);
    setErrors((e) => ({ ...e, amount: undefined }));
  }

  function step(delta: number) {
    const current = Number.isInteger(amountNum) ? amountNum : 0;
    changeAmount(String(Math.max(0, current + delta)));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = adjustStockSchema(product.stockPhysical, product.stockLocked).safeParse({
      mode,
      amount,
      reason,
      note,
    });
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    adjust.mutate({ productId: product.id, ...parsed.data });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <BackHeader
        actions={
          <div className="flex gap-2.5">
            <Button
              asChild
              variant="outline"
              className="h-[37px] rounded-[8px] flex-1 border-ink-300 bg-white px-4 font-semibold text-ink-900 sm:flex-none"
            >
              <Link href="/admin/stok">Batal</Link>
            </Button>
            <Button
              type="submit"
              disabled={adjust.isPending}
              className="h-[37px] rounded-[8px] flex-1 gap-2 px-4 font-semibold sm:flex-none"
            >
              {adjust.isPending ? <Spinner /> : <CheckIcon />}
              Simpan Penyesuaian
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-4 rounded-[12px] border border-ink-200 bg-white p-[15px]">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt="" className="size-14 shrink-0 rounded-[10px] object-cover" />
        ) : (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-[10px] bg-ink-100 text-ink-500">
            <PackageIcon className="size-6" />
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-base leading-[19px] font-semibold text-ink-900">{product.name}</span>
          <span className="text-xs leading-[15px] text-ink-500">
            {product.condition === "baru" ? "Baru" : "Bekas"}
          </span>
        </div>
        <dl className="flex gap-4">
          {(
            [
              ["Fisik", product.stockPhysical, "text-ink-900"],
              ["Terkunci", product.stockLocked, product.stockLocked > 0 ? "text-info" : "text-ink-900"],
              ["Tersedia", available, availableTone(available)],
            ] as const
          ).map(([label, n, tone]) => (
            <div key={label} className="flex flex-col items-end gap-0.5 pl-6">
              <dt className="text-xs leading-[15px] text-ink-500">{label}</dt>
              <dd className={cn("font-heading text-2xl leading-[31px] font-bold tabular-nums", tone)}>{n}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span id={`${fieldId}-mode-label`} className={labelClass}>
              Jenis penyesuaian
            </span>
            <div
              role="radiogroup"
              aria-labelledby={`${fieldId}-mode-label`}
              className="flex gap-1 rounded-[10px] bg-ink-100 p-1"
            >
              {ADJUST_MODES.map((m) => {
                const active = mode === m;
                const { icon: Icon, activeTone } = MODE_ICON[m];
                return (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      setMode(m);
                      setErrors((e) => ({ ...e, amount: undefined }));
                    }}
                    className={cn(
                      "flex h-[37px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[7px] text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                      active
                        ? "bg-white font-semibold text-ink-900 shadow-[0_1px_2px_#1C19171A]"
                        : "font-medium text-ink-600 hover:text-ink-900"
                    )}
                  >
                    <Icon className={cn("size-[15px]", active ? activeTone : "text-ink-600")} />
                    {ADJUST_MODE_LABEL[m]}
                  </button>
                );
              })}
            </div>
          </div>

          <Field data-invalid={Boolean(errors.amount)} className="gap-2">
            <FieldLabel htmlFor={`${fieldId}-amount`} className={labelClass}>
              {mode === "atur" ? "Stok fisik baru" : "Jumlah"}
            </FieldLabel>
            <div
              className={cn(
                "flex h-12 w-48! items-center overflow-hidden rounded-[10px] border border-ink-300 bg-white focus-within:border-brand-600",
                errors.amount && "border-error"
              )}
            >
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Kurangi jumlah"
                className="flex size-12 shrink-0 cursor-pointer items-center justify-center text-ink-700 hover:bg-ink-50"
              >
                <MinusIcon className="size-4" />
              </button>
              <input
                id={`${fieldId}-amount`}
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="0"
                value={amount}
                autoFocus
                onChange={(e) => changeAmount(e.target.value)}
                aria-invalid={Boolean(errors.amount)}
                className="h-full w-24 shrink-0 [appearance:textfield] border-x border-ink-300 bg-transparent text-center font-heading text-xl font-bold text-ink-900 tabular-nums outline-none placeholder:text-ink-300 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Tambah jumlah"
                className="flex size-12 shrink-0 cursor-pointer items-center justify-center text-ink-700 hover:bg-ink-50"
              >
                <PlusIcon className="size-4" />
              </button>
            </div>
            <FieldError className="text-xs">{errors.amount}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.reason)} className="gap-1.5">
            <FieldLabel htmlFor={`${fieldId}-reason`} className={labelClass}>
              Alasan
            </FieldLabel>
            <div
              className={cn(
                "flex h-[42px] items-center gap-2 rounded-[8px] border border-ink-300 bg-white px-3 focus-within:border-brand-600",
                errors.reason && "border-error"
              )}
            >
              <input
                id={`${fieldId}-reason`}
                list={`${fieldId}-reasons`}
                placeholder="Contoh: Barang masuk dari distributor"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setErrors((er) => ({ ...er, reason: undefined }));
                }}
                aria-invalid={Boolean(errors.reason)}
                className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-500 [&::-webkit-calendar-picker-indicator]:opacity-0"
              />
              <ChevronDownIcon className="pointer-events-none size-4 shrink-0 text-ink-500" />
            </div>
            <datalist id={`${fieldId}-reasons`}>
              {REASONS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
            <FieldError className="text-xs">{errors.reason}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.note)} className="gap-1.5">
            <FieldLabel htmlFor={`${fieldId}-note`} className={labelClass}>
              Catatan (opsional)
            </FieldLabel>
            <textarea
              id={`${fieldId}-note`}
              placeholder="Contoh: Nota PT Sinar Teknik No. 4471"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setErrors((er) => ({ ...er, note: undefined }));
              }}
              aria-invalid={Boolean(errors.note)}
              className={cn(
                "h-[84px] resize-none rounded-[8px] border border-ink-300 bg-white p-3 text-sm text-ink-900 outline-none placeholder:text-ink-500 focus:border-brand-600",
                errors.note && "border-error"
              )}
            />
            {errors.note ? (
              <FieldError className="text-xs">{errors.note}</FieldError>
            ) : (
              <FieldDescription className={hintClass}>Tercatat bersama nama dan waktu perubahan</FieldDescription>
            )}
          </Field>
        </div>

        <div className="flex w-full flex-col gap-4 rounded-[14px] bg-ink-50 p-6 lg:w-[360px] lg:shrink-0">
          <span className="text-[13px] leading-4 font-semibold text-ink-500">Setelah disimpan</span>
          <PreviewRow label="Stok fisik" from={product.stockPhysical} to={newPhysical} invalid={newPhysical !== null && newPhysical < product.stockLocked} />
          <PreviewRow label="Tersedia di katalog" from={available} to={newAvailable} invalid={newAvailable !== null && newAvailable < 0} />
          {newAvailable !== null && available <= LOW_STOCK && newAvailable > LOW_STOCK ? (
            <p className="flex items-center gap-2 rounded-[10px] bg-success-soft p-3 text-[13px] leading-4 font-medium text-success">
              <CircleCheckIcon className="size-4 shrink-0" />
              Peringatan stok menipis hilang otomatis
            </p>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function PreviewRow({
  label,
  from,
  to,
  invalid,
}: {
  label: string;
  from: number;
  to: number | null;
  invalid: boolean;
}) {
  const next = to ?? from;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] leading-4 text-ink-600">{label}</span>
      <span className="flex items-center gap-3 font-heading text-[28px] leading-9 tabular-nums">
        <span className="font-semibold text-ink-500">{from}</span>
        <ArrowRightIcon className="size-[18px] text-ink-500" />
        <span
          className={cn(
            "font-bold",
            invalid ? "text-error" : next > from ? "text-success" : next < from ? "text-warning" : "text-ink-900"
          )}
        >
          {next}
        </span>
      </span>
    </div>
  );
}
