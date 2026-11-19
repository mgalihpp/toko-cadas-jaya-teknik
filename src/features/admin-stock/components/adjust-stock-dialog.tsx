"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRightIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import {
  ADJUST_MODES,
  ADJUST_MODE_LABEL,
  REASONS,
  adjustStockSchema,
  computeNewPhysical,
  type AdjustMode,
} from "../schemas";

export type StockProduct = {
  id: string;
  name: string;
  condition: "baru" | "bekas";
  stockPhysical: number;
  stockLocked: number;
  available: number;
};

export function AdjustStockDialog({
  product,
  onOpenChange,
}: {
  product: StockProduct | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={product !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {product ? (
          <AdjustForm key={product.id} product={product} onDone={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type Errors = Partial<Record<"amount" | "reason" | "note", string>>;

function AdjustForm({ product, onDone }: { product: StockProduct; onDone: () => void }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AdjustMode>("tambah");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const adjust = useMutation(
    trpc.admin.stock.adjust.mutationOptions({
      onSuccess: async () => {
        toast.success("Stok diperbarui");
        onDone();
        await Promise.all([
          queryClient.invalidateQueries(trpc.admin.stock.pathFilter()),
          queryClient.invalidateQueries(trpc.admin.products.pathFilter()),
          queryClient.invalidateQueries(trpc.admin.finance.dashboard.pathFilter()),
          queryClient.invalidateQueries(trpc.catalog.pathFilter()),
        ]);
      },
      onError: (error) => setErrors({ amount: error.message }),
    })
  );

  const amountNum = Number(amount);
  const preview =
    amount.trim() && Number.isInteger(amountNum) && amountNum >= 0
      ? computeNewPhysical(mode, product.stockPhysical, amountNum)
      : null;

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
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>Sesuaikan Stok</DialogTitle>
        <DialogDescription className="truncate">{product.name}</DialogDescription>
      </DialogHeader>

      <dl className="grid grid-cols-3 divide-x divide-ink-200 rounded-lg border border-ink-200 bg-ink-50 text-center">
        {(
          [
            ["Fisik", product.stockPhysical],
            ["Terkunci", product.stockLocked],
            ["Tersedia", product.available],
          ] as const
        ).map(([label, n]) => (
          <div key={label} className="flex flex-col gap-0.5 p-2">
            <dt className="text-xs text-ink-500">{label}</dt>
            <dd className="font-heading text-lg font-semibold text-ink-900 tabular-nums">{n}</dd>
          </div>
        ))}
      </dl>

      <Field>
        <FieldLabel asChild>
          <span>Jenis penyesuaian</span>
        </FieldLabel>
        <ToggleGroup
          type="single"
          variant="outline"
          value={mode}
          onValueChange={(v) => {
            if (v) setMode(v as AdjustMode);
            setErrors((e) => ({ ...e, amount: undefined }));
          }}
          className="w-full"
        >
          {ADJUST_MODES.map((m) => (
            <ToggleGroupItem
              key={m}
              value={m}
              className="flex-1 data-[state=on]:border-brand-500 data-[state=on]:bg-brand-50 data-[state=on]:text-brand-700"
            >
              {ADJUST_MODE_LABEL[m]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>

      <Field data-invalid={Boolean(errors.amount)}>
        <FieldLabel htmlFor="adjust-amount">
          {mode === "atur" ? "Stok fisik baru" : "Jumlah"}
        </FieldLabel>
        <Input
          id="adjust-amount"
          type="number"
          min={0}
          inputMode="numeric"
          className="h-10"
          placeholder="0"
          value={amount}
          autoFocus
          onChange={(e) => {
            setAmount(e.target.value);
            setErrors((er) => ({ ...er, amount: undefined }));
          }}
          aria-invalid={Boolean(errors.amount)}
        />
        <FieldError>{errors.amount}</FieldError>
      </Field>

      <Field data-invalid={Boolean(errors.reason)}>
        <FieldLabel htmlFor="adjust-reason">Alasan</FieldLabel>
        <Input
          id="adjust-reason"
          className="h-10"
          list="adjust-reasons"
          placeholder="Contoh: Barang masuk dari distributor"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setErrors((er) => ({ ...er, reason: undefined }));
          }}
          aria-invalid={Boolean(errors.reason)}
        />
        <datalist id="adjust-reasons">
          {REASONS.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
        <FieldError>{errors.reason}</FieldError>
      </Field>

      <Field data-invalid={Boolean(errors.note)}>
        <FieldLabel htmlFor="adjust-note">Catatan (opsional)</FieldLabel>
        <Input
          id="adjust-note"
          className="h-10"
          placeholder="Contoh: Nota PT Sinar Teknik No. 4471"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-invalid={Boolean(errors.note)}
        />
        {errors.note ? (
          <FieldError>{errors.note}</FieldError>
        ) : (
          <FieldDescription>Tercatat bersama nama dan waktu perubahan</FieldDescription>
        )}
      </Field>

      <div className="flex flex-col gap-2 rounded-lg border border-ink-200 p-3 text-sm">
        <span className="font-semibold text-ink-900">Setelah disimpan</span>
        <PreviewRow label="Stok fisik" from={product.stockPhysical} to={preview} />
        <PreviewRow
          label="Tersedia di katalog"
          from={product.available}
          to={preview === null ? null : preview - product.stockLocked}
        />
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={adjust.isPending}>
            Batal
          </Button>
        </DialogClose>
        <Button type="submit" disabled={adjust.isPending}>
          {adjust.isPending ? <Spinner /> : null}
          Simpan Penyesuaian
        </Button>
      </DialogFooter>
    </form>
  );
}

function PreviewRow({ label, from, to }: { label: string; from: number; to: number | null }) {
  const invalid = to !== null && to < 0;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-ink-600">{label}</span>
      <span className="flex items-center gap-2 tabular-nums">
        <span className="text-ink-500">{from}</span>
        <ArrowRightIcon className="size-3.5 text-ink-500" />
        <span
          className={cn(
            "font-semibold",
            invalid ? "text-error" : to !== null && to !== from ? "text-brand-600" : "text-ink-900"
          )}
        >
          {to ?? from}
        </span>
      </span>
    </div>
  );
}
