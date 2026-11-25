"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CheckIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  ExternalLinkIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { formatFullStamp, formatStamp } from "../format";
import { useOrderActions } from "../hooks/use-order-actions";
import { rejectNoteSchema } from "../schemas";
import type { AdminOrderDetail, AdminOrderPayment } from "../types";
import { ConfirmAction } from "./confirm-action";
import { PaymentStatusBadge } from "./payment-status-badge";

type ProofPanelProps = {
  order: AdminOrderDetail;
  payment: AdminOrderPayment;
};

type Tone = "ok" | "warn" | "neutral";

const TONE: Record<Tone, { icon: LucideIcon; className: string }> = {
  ok: { icon: CircleCheckIcon, className: "text-success" },
  warn: { icon: CircleAlertIcon, className: "text-warning" },
  neutral: { icon: CircleCheckIcon, className: "text-ink-500" },
};

export function ProofPanel({ order, payment }: ProofPanelProps) {
  const trpc = useTRPC();
  const settings = useQuery(trpc.settings.get.queryOptions());
  const actions = useOrderActions();
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [zoomed, setZoomed] = useState(false);
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const canDecide =
    order.paymentMethod === "transfer" &&
    order.status === "menunggu_konfirmasi" &&
    payment.status === "menunggu";
  const amountMatches = payment.amount === order.total;
  const noteResult = rejectNoteSchema.safeParse(note);
  const noteError =
    touched && !noteResult.success
      ? noteResult.error.issues[0]?.message
      : undefined;
  const afterOrder = new Date(payment.createdAt) >= new Date(order.createdAt);
  const accounts = settings.data?.bankAccounts ?? [];

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-info-border bg-info-soft p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg leading-[23px] font-semibold text-ink-900">
          {canDecide ? "Periksa bukti transfer" : "Bukti transfer"}
        </h2>
        {payment.proofUrl ? (
          <button
            type="button"
            className="text-[13px] leading-4 font-semibold text-info hover:underline"
            onClick={() => setZoomed(true)}
          >
            Perbesar
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-5 sm:flex-row">
        {payment.proofUrl ? (
          <button
            type="button"
            onClick={() => setZoomed(true)}
            className="group mx-auto block h-[340px] w-full max-w-60 shrink-0 overflow-hidden rounded-[12px] border border-ink-200 bg-white p-2 sm:mx-0 sm:w-60"
            aria-label="Perbesar bukti transfer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={payment.proofUrl}
              alt={`Bukti transfer pesanan ${order.code}`}
              className="size-full object-contain transition-transform group-hover:scale-[1.02]"
            />
          </button>
        ) : (
          <div className="mx-auto flex h-[340px] w-full max-w-60 shrink-0 items-center justify-center rounded-[12px] border border-dashed border-ink-300 bg-white p-4 text-center text-sm text-ink-500 sm:mx-0 sm:w-60">
            Bukti transfer tidak tersedia
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          <CheckRow
            label="Nominal"
            value={formatRupiah(payment.amount)}
            tone={amountMatches ? "ok" : "warn"}
            hint={
              amountMatches
                ? "sesuai total pesanan"
                : `berbeda dari total ${formatRupiah(order.total)}`
            }
          />
          {accounts.length > 0 ? (
            <CheckRow
              label="Rekening tujuan"
              value={accounts.map((a) => `${a.bank} ${a.number}`).join(", ")}
              tone="neutral"
              hint="cocokkan dengan bukti"
            />
          ) : null}
          <CheckRow
            label="Waktu unggah"
            value={formatStamp(payment.createdAt)}
            tone={afterOrder ? "ok" : "warn"}
            hint={
              afterOrder ? "setelah pesanan dibuat" : "sebelum pesanan dibuat"
            }
          />
          {canDecide ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="reject-note"
                  className="text-[13px] leading-4 font-semibold text-ink-900"
                >
                  Catatan untuk pelanggan (wajib jika ditolak)
                </label>
                <Textarea
                  ref={noteRef}
                  id="reject-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="Contoh: nominal kurang Rp 20.000"
                  aria-invalid={Boolean(noteError)}
                  aria-describedby={noteError ? "reject-note-error" : undefined}
                  maxLength={300}
                  className="min-h-16 rounded-md border-ink-300 bg-white p-3 text-sm placeholder:text-ink-500 md:text-sm"
                />
                {noteError ? (
                  <p id="reject-note-error" className="text-xs text-error">
                    {noteError}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <ConfirmAction
                  title="Tolak bukti transfer?"
                  description="Pesanan kembali ke Menunggu pembayaran dan pelanggan diminta mengunggah bukti baru. Catatan ini tampil ke pelanggan."
                  confirmLabel="Tolak bukti"
                  destructive
                  pending={actions.rejectTransfer.isPending}
                  disabled={!noteResult.success}
                  onConfirm={async () => {
                    await actions.rejectTransfer.mutateAsync({
                      code: order.code,
                      note: note.trim(),
                    });
                    setNote("");
                    setTouched(false);
                  }}
                  trigger={
                    <Button
                      variant="outline"
                      className="h-[46px] min-w-0 flex-1 gap-2 rounded-md border-ink-300 bg-white px-2.5 text-sm font-semibold text-error hover:bg-error-soft hover:text-error"
                      onClick={(e) => {
                        if (noteResult.success) return;
                        e.preventDefault();
                        setTouched(true);
                        noteRef.current?.focus();
                      }}
                    >
                      <XIcon />
                      Tolak Bukti
                    </Button>
                  }
                >
                  <p className="rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-700">
                    {note.trim()}
                  </p>
                </ConfirmAction>
                <ConfirmAction
                  title="Konfirmasi pembayaran?"
                  description={`Pastikan dana ${formatRupiah(payment.amount)} sudah masuk ke rekening toko. Stok akan dicatat terjual.`}
                  confirmLabel="Konfirmasi"
                  confirmClassName="bg-success text-white hover:bg-success/90"
                  pending={actions.confirmTransfer.isPending}
                  onConfirm={() =>
                    actions.confirmTransfer.mutateAsync({ code: order.code })
                  }
                  trigger={
                    <Button className="h-[46px] min-w-0 flex-1 gap-2 rounded-md bg-success px-2.5 text-sm font-semibold text-white hover:bg-success/90">
                      <CheckIcon />
                      Konfirmasi Pembayaran
                    </Button>
                  }
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-white p-3.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-ink-500">Status bukti</span>
                {payment.ownerNote ? (
                  <span className="text-sm text-ink-700">
                    Catatan: {payment.ownerNote}
                  </span>
                ) : null}
              </div>
              <PaymentStatusBadge status={payment.status} />
            </div>
          )}
        </div>
      </div>

      {payment.proofUrl ? (
        <Dialog open={zoomed} onOpenChange={setZoomed}>
          <DialogContent className="max-h-[95vh] sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Bukti transfer {order.code}</DialogTitle>
              <DialogDescription>
                Diunggah {formatFullStamp(payment.createdAt)}, nominal{" "}
                {formatRupiah(payment.amount)}
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
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: Tone;
  hint: string;
}) {
  const { icon: Icon, className } = TONE[tone];
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white p-3.5">
      <Icon className={cn("size-[18px] shrink-0", className)} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs leading-[15px] text-ink-500">{label}</span>
        <span className="text-sm leading-[17px] font-semibold text-ink-900">
          {value}
        </span>
      </div>
      <span className={cn("shrink-0 text-right text-xs", className)}>
        {hint}
      </span>
    </div>
  );
}
