"use client";

import {
  CheckCircle2Icon,
  CheckIcon,
  CircleAlertIcon,
  ExternalLinkIcon,
  Maximize2Icon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { useOrderActions } from "../hooks/use-order-actions";
import { rejectNoteSchema } from "../schemas";
import type { AdminOrderDetail, AdminOrderPayment } from "../types";
import { ConfirmAction } from "./confirm-action";
import { PaymentStatusBadge } from "./payment-status-badge";

type ProofPanelProps = {
  order: AdminOrderDetail;
  payment: AdminOrderPayment;
};

export function ProofPanel({ order, payment }: ProofPanelProps) {
  const actions = useOrderActions();
  const [zoomed, setZoomed] = useState(false);
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const canDecide =
    order.paymentMethod === "transfer" &&
    order.status === "menunggu_konfirmasi" &&
    payment.status === "menunggu";
  const amountMatches = payment.amount === order.total;
  const noteResult = rejectNoteSchema.safeParse(note);
  const noteError = touched && !noteResult.success ? noteResult.error.issues[0]?.message : undefined;
  const afterOrder = new Date(payment.createdAt) >= new Date(order.createdAt);

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-info-border bg-info-soft p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-ink-900">
          {canDecide ? "Periksa bukti transfer" : "Bukti transfer"}
        </h2>
        {payment.proofUrl ? (
          <Button
            variant="link"
            className="h-auto p-0 text-[13px] font-semibold text-info"
            onClick={() => setZoomed(true)}
          >
            <Maximize2Icon />
            Perbesar
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-5 sm:flex-row">
        {payment.proofUrl ? (
          <button
            type="button"
            onClick={() => setZoomed(true)}
            className="group relative mx-auto block w-full max-w-60 shrink-0 overflow-hidden rounded-xl border border-ink-200 bg-white sm:mx-0"
            aria-label="Perbesar bukti transfer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={payment.proofUrl}
              alt={`Bukti transfer pesanan ${order.code}`}
              className="aspect-[3/4] w-full object-contain transition-transform group-hover:scale-[1.02]"
            />
          </button>
        ) : (
          <div className="flex aspect-[3/4] w-full max-w-60 items-center justify-center rounded-xl border border-dashed border-ink-300 bg-white p-4 text-center text-sm text-ink-500">
            Bukti transfer tidak tersedia
          </div>
        )}

        <div className="flex flex-1 flex-col gap-3">
          <CheckRow
            label="Nominal"
            value={formatRupiah(payment.amount)}
            ok={amountMatches}
            hint={
              amountMatches
                ? "sesuai total pesanan"
                : `berbeda dari total ${formatRupiah(order.total)}`
            }
          />
          <CheckRow
            label="Waktu unggah"
            value={formatDateTime(payment.createdAt)}
            ok={afterOrder}
            hint={afterOrder ? "setelah pesanan dibuat" : "sebelum pesanan dibuat"}
          />
          <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3">
            <div className="flex flex-col">
              <span className="text-xs text-ink-500">Status bukti</span>
              {payment.ownerNote ? (
                <span className="text-sm text-ink-700">Catatan: {payment.ownerNote}</span>
              ) : null}
            </div>
            <PaymentStatusBadge status={payment.status} />
          </div>
        </div>
      </div>

      {canDecide ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <ConfirmAction
            title="Tolak bukti transfer?"
            description="Pesanan kembali ke Menunggu pembayaran dan pelanggan diminta mengunggah bukti baru. Catatan ini tampil ke pelanggan."
            confirmLabel="Tolak bukti"
            destructive
            pending={actions.rejectTransfer.isPending}
            disabled={!noteResult.success}
            onOpenChange={(open) => {
              if (!open) {
                setNote("");
                setTouched(false);
              }
            }}
            onConfirm={() =>
              actions.rejectTransfer.mutateAsync({ code: order.code, note: note.trim() })
            }
            trigger={
              <Button
                variant="outline"
                className="border-error-border bg-white text-error hover:bg-error-soft hover:text-error"
              >
                <XIcon />
                Tolak bukti
              </Button>
            }
          >
            <Field data-invalid={Boolean(noteError)}>
              <FieldLabel htmlFor="reject-note">Catatan untuk pelanggan</FieldLabel>
              <Textarea
                id="reject-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Contoh: nominal kurang Rp 20.000"
                aria-invalid={Boolean(noteError)}
                maxLength={300}
                rows={3}
              />
              {noteError ? (
                <FieldError>{noteError}</FieldError>
              ) : (
                <FieldDescription>Wajib diisi, minimal 3 huruf.</FieldDescription>
              )}
            </Field>
          </ConfirmAction>
          <ConfirmAction
            title="Konfirmasi pembayaran?"
            description={`Pastikan dana ${formatRupiah(payment.amount)} sudah masuk ke rekening toko. Stok akan dicatat terjual.`}
            confirmLabel="Konfirmasi"
            confirmClassName="bg-success text-white hover:bg-success/90"
            pending={actions.confirmTransfer.isPending}
            onConfirm={() => actions.confirmTransfer.mutateAsync({ code: order.code })}
            trigger={
              <Button className="bg-success text-white hover:bg-success/90">
                <CheckIcon />
                Konfirmasi pembayaran
              </Button>
            }
          />
        </div>
      ) : null}

      {payment.proofUrl ? (
        <Dialog open={zoomed} onOpenChange={setZoomed}>
          <DialogContent className="max-h-[95vh] sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Bukti transfer {order.code}</DialogTitle>
              <DialogDescription>
                Diunggah {formatDateTime(payment.createdAt)}, nominal {formatRupiah(payment.amount)}
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-auto rounded-lg bg-ink-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={payment.proofUrl}
                alt={`Bukti transfer pesanan ${order.code}`}
                className="mx-auto max-h-[70vh] w-auto object-contain"
              />
            </div>
            <a
              href={payment.proofUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-info hover:underline"
            >
              <ExternalLinkIcon className="size-4" />
              Buka ukuran asli di tab baru
            </a>
          </DialogContent>
        </Dialog>
      ) : null}
    </section>
  );
}

function CheckRow({
  label,
  value,
  ok,
  hint,
}: {
  label: string;
  value: string;
  ok: boolean;
  hint: string;
}) {
  const Icon = ok ? CheckCircle2Icon : CircleAlertIcon;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3">
      <div className="flex flex-col">
        <span className="text-xs text-ink-500">{label}</span>
        <span className="text-sm font-semibold text-ink-900">{value}</span>
      </div>
      <span
        className={
          ok
            ? "flex items-center gap-1 text-right text-xs text-success"
            : "flex items-center gap-1 text-right text-xs text-warning"
        }
      >
        <Icon className="size-3.5 shrink-0" />
        {hint}
      </span>
    </div>
  );
}
