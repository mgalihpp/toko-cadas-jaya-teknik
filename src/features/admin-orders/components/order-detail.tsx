"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckIcon, EyeIcon, PackageIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { AdminHeader } from "@/components/layout";
import { MButton } from "@/components/mobile/m-button";
import { BottomSheet, SheetClose, SheetRoot } from "@/components/mobile/sheet";
import { StickyBar } from "@/components/mobile/sticky-bar";
import { EmptyState, ErrorState, OrderStatusBadge } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { formatTime } from "../format";
import { useOrderActions } from "../hooks/use-order-actions";
import type { AdminOrderDetail as Order } from "../types";

const REASONS = ["Nominal tidak sesuai", "Foto buram", "Bukan bukti transfer"];

type Step = { key: string; label: string; note?: string; state: "done" | "current" | "upcoming" | "failed" };

function buildSteps(order: Order): Step[] {
  const who = (actor: string | null) => (actor && actor === order.userId ? "Pelanggan" : "Owner");
  const label: Record<string, string> = {
    menunggu_pembayaran: "Pesanan dibuat",
    menunggu_konfirmasi: "Bukti diunggah",
    dibayar: "Dibayar",
    diproses: "Diproses",
    selesai: "Selesai",
    dibatalkan: "Dibatalkan",
  };
  const steps: Step[] = order.statusLogs.map((l) => ({
    key: l.id,
    label: label[l.toStatus],
    note: `${formatTime(l.createdAt).replace(":", ".")} · ${who(l.actorId)}`,
    state: l.toStatus === "dibatalkan" ? "failed" : "done",
  }));
  const terminal = order.status === "selesai" || order.status === "dibatalkan";
  if (steps.length > 0 && !terminal) {
    const last = steps[steps.length - 1];
    if (order.status === "menunggu_konfirmasi") {
      steps.push({ key: "cek", label: "Menunggu konfirmasi", note: "Sekarang", state: "current" });
    } else if (order.status === "menunggu_pembayaran") {
      last.state = "current";
    }
  }
  const next =
    order.status === "dibayar"
      ? ["Diproses", "Selesai"]
      : order.status === "diproses"
        ? ["Selesai"]
        : order.status === "menunggu_konfirmasi"
          ? ["Dibayar", "Diproses"]
          : [];
  next.forEach((n) => steps.push({ key: `next-${n}`, label: n, state: "upcoming" }));
  return steps;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <section className="flex flex-col gap-2.5 bg-white p-3">
        <h2 className="text-[15px] font-bold text-ink-900">{title}</h2>
        {children}
      </section>
      <div className="h-1.5 shrink-0" />
    </>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <p className="w-[110px] shrink-0 text-sm text-ink-500">{label}</p>
      <p className="min-w-0 flex-1 text-sm font-medium text-ink-900">{children}</p>
    </div>
  );
}

export function AdminOrderDetail({ code }: { code: string }) {
  const trpc = useTRPC();
  const { data: order, isPending, isError, error, refetch } = useQuery(
    trpc.admin.orders.byCode.queryOptions({ code }, { retry: false }),
  );
  const actions = useOrderActions();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");
  const [zoom, setZoom] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (isPending) {
    return (
      <div className="flex flex-1 flex-col">
        <AdminHeader title={code} backHref="/admin/pesanan" />
        <div role="status" className="flex flex-col gap-1.5">
          <Skeleton className="h-64 rounded-none" />
          <Skeleton className="h-32 rounded-none" />
          <Skeleton className="h-32 rounded-none" />
        </div>
      </div>
    );
  }
  if (isError) {
    const notFound = error.data?.code === "NOT_FOUND";
    return (
      <div className="flex flex-1 flex-col">
        <AdminHeader title={code} backHref="/admin/pesanan" />
        {notFound ? (
          <EmptyState icon={TriangleAlertIcon} title="Pesanan tidak ditemukan" description="Kode pesanan ini tidak ada." />
        ) : (
          <ErrorState onRetry={() => refetch()} />
        )}
      </div>
    );
  }

  const proof = order.payments.find((p) => p.proofUrl);
  const steps = buildSteps(order);
  const busy =
    actions.confirmTransfer.isPending ||
    actions.rejectTransfer.isPending ||
    actions.recordCash.isPending ||
    actions.advance.isPending ||
    actions.cancel.isPending;
  const awaiting = order.status === "menunggu_konfirmasi";
  const canCancel = order.status === "menunggu_pembayaran" || order.status === "menunggu_konfirmasi";
  const noteValid = note.trim().length >= 3;

  return (
    <div className="flex flex-1 flex-col pb-[76px]">
      <AdminHeader
        title={order.code}
        backHref="/admin/pesanan"
        right={<OrderStatusBadge status={order.status} className="mr-3" />}
      />

      {order.paymentMethod === "transfer" ? (
        <Section title="Bukti transfer">
          {proof?.proofUrl ? (
            <button
              type="button"
              onClick={() => setZoom(true)}
              onDoubleClick={() => setZoom(true)}
              className="relative h-[210px] overflow-hidden rounded-xl bg-toast"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={proof.proofUrl} alt="Bukti transfer" className="size-full object-cover" />
              <span className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-[14px] bg-[rgba(15,36,56,.75)] px-2.5 py-[5px] text-xs text-white">
                <EyeIcon className="size-3.5" />
                Ketuk 2x untuk zoom
              </span>
            </button>
          ) : (
            <p className="rounded-xl bg-ink-50 py-8 text-center text-sm text-ink-500">Belum ada bukti diunggah.</p>
          )}
          <div className="flex items-center gap-2">
            <p className="flex-1 text-[13px] text-ink-500">Nominal diharapkan</p>
            <p className="text-[15px] font-bold text-brand-700">{formatRupiah(order.total)}</p>
          </div>
        </Section>
      ) : null}

      <Section title="Pelanggan">
        <Info label="Nama">{order.recipientName}</Info>
        <Info label="Telepon">{order.phone}</Info>
        <Info label="Pengambilan">{order.fulfillment === "ambil" ? "Ambil di toko" : "Dikirim"}</Info>
        {order.fulfillment === "kirim" && order.address ? <Info label="Alamat">{order.address}</Info> : null}
      </Section>

      <Section title="Produk">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <p className="flex-1 text-sm font-medium text-ink-900">
              {item.productName} x{item.quantity}
            </p>
            <p className="text-sm font-bold text-ink-900">{formatRupiah(item.unitPrice * item.quantity)}</p>
          </div>
        ))}
        {awaiting ? (
          <div className="flex gap-2.5 rounded-[10px] border border-warning-border bg-warning-soft px-2.5 py-2">
            <TriangleAlertIcon className="size-5 shrink-0 text-warning" strokeWidth={2} />
            <p className="text-[13px] text-ink-900">Menerima pembayaran mengurangi stok fisik secara permanen.</p>
          </div>
        ) : null}
      </Section>

      <section className="flex flex-col gap-1.5 bg-white p-3">
        <h2 className="text-[15px] font-bold text-ink-900">Riwayat status</h2>
        <ol className="flex flex-col pt-1.5">
          {steps.map((step, i) => {
            const dot =
              step.state === "done"
                ? "bg-success"
                : step.state === "failed"
                  ? "bg-error"
                  : step.state === "current"
                    ? "bg-brand-600 shadow-[0_0_0_5px_var(--color-brand-100)]"
                    : "bg-ink-300";
            return (
              <li key={step.key} className="relative flex gap-3 pb-4 last:pb-0">
                <span className={cn("z-10 flex size-6 shrink-0 items-center justify-center rounded-full", dot)}>
                  {step.state === "done" ? <CheckIcon className="size-4 text-white" strokeWidth={3} /> : null}
                  {step.state === "failed" ? <XIcon className="size-4 text-white" strokeWidth={3} /> : null}
                  {step.state === "current" ? <span className="size-2 rounded-full bg-white" /> : null}
                </span>
                {i === steps.length - 1 ? null : (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-[26px] -bottom-1 left-[11px] w-0.5",
                      step.state === "done" ? "bg-success" : "bg-[#DCE3EA]",
                    )}
                  />
                )}
                <div className="flex flex-col gap-0.5">
                  <p className={cn("text-sm font-bold", step.state === "upcoming" ? "text-ink-500" : "text-ink-900")}>
                    {step.label}
                  </p>
                  {step.note ? <p className="text-xs text-ink-500">{step.note}</p> : <p className="h-4" />}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <StickyBar>
        {awaiting ? (
          <>
            <MButton variant="dangerOutline" size="lg" className="flex-1" disabled={busy} onClick={() => setRejectOpen(true)}>
              <XIcon className="size-[18px]" />
              Tolak
            </MButton>
            <MButton
              variant="success"
              size="lg"
              className="flex-1"
              loading={actions.confirmTransfer.isPending}
              disabled={busy}
              onClick={() => actions.confirmTransfer.mutate({ code: order.code })}
            >
              <CheckIcon className="size-[18px]" />
              Terima pembayaran
            </MButton>
          </>
        ) : order.status === "menunggu_pembayaran" ? (
          <>
            {canCancel ? (
              <MButton variant="dangerOutline" size="lg" className="flex-1" disabled={busy} onClick={() => setCancelOpen(true)}>
                Batalkan
              </MButton>
            ) : null}
            {order.paymentMethod === "tunai" ? (
              <MButton
                variant="success"
                size="lg"
                className="flex-1"
                loading={actions.recordCash.isPending}
                disabled={busy}
                onClick={() => actions.recordCash.mutate({ code: order.code })}
              >
                <CheckIcon className="size-[18px]" />
                Catat tunai
              </MButton>
            ) : null}
          </>
        ) : order.status === "dibayar" || order.status === "diproses" ? (
          <MButton
            size="lg"
            block
            loading={actions.advance.isPending}
            disabled={busy}
            onClick={() =>
              actions.advance.mutate({ code: order.code, to: order.status === "dibayar" ? "diproses" : "selesai" })
            }
          >
            <PackageIcon className="size-[18px]" />
            {order.status === "dibayar" ? "Tandai diproses" : "Tandai selesai"}
          </MButton>
        ) : (
          <p className="flex-1 text-center text-sm text-ink-500">Pesanan sudah ditutup.</p>
        )}
      </StickyBar>

      <SheetRoot open={rejectOpen} onOpenChange={setRejectOpen}>
        <BottomSheet title="Tolak bukti transfer">
          <div className="flex h-12 items-center gap-1 pr-2 pl-4">
            <p className="flex-1 text-[17px] font-bold text-ink-900">Tolak bukti transfer</p>
            <SheetClose aria-label="Tutup" className="flex size-10 items-center justify-center rounded-full text-ink-500">
              <XIcon className="size-6" strokeWidth={1.8} />
            </SheetClose>
          </div>
          <div className="flex flex-col gap-3 px-4 py-1">
            <p className="text-[13px] text-ink-500">
              Pelanggan akan diminta mengunggah ulang bukti. Pesanan kembali ke Menunggu pembayaran.
            </p>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reject-note" className="text-[13px] font-medium text-ink-900">
                Catatan untuk pelanggan
              </label>
              <textarea
                id="reject-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                className={cn(
                  "h-24 resize-none rounded-[10px] bg-white px-3 py-2.5 text-[15px] text-ink-900 outline-none",
                  noteValid ? "border-2 border-brand-600" : "border-2 border-error",
                )}
              />
              <p className={cn("flex items-center gap-1 text-xs", noteValid ? "text-ink-500" : "font-medium text-error")}>
                <CheckIcon className="size-3.5" />
                Catatan wajib diisi
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setNote(reason)}
                  className="rounded-[14px] border-[1.5px] border-ink-200 px-2.5 py-1.5 text-xs font-bold text-brand-700"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2.5 border-t border-ink-200 px-4 pt-2.5 pb-[18px]">
            <MButton variant="outline" size="lg" className="w-[110px]" onClick={() => setRejectOpen(false)}>
              Batal
            </MButton>
            <MButton
              variant="danger"
              size="lg"
              block
              disabled={!noteValid}
              loading={actions.rejectTransfer.isPending}
              onClick={() =>
                actions.rejectTransfer.mutate(
                  { code: order.code, note: note.trim() },
                  {
                    onSuccess: () => {
                      setRejectOpen(false);
                      setNote("");
                    },
                  },
                )
              }
            >
              <XIcon className="size-[18px]" />
              Tolak bukti
            </MButton>
          </div>
        </BottomSheet>
      </SheetRoot>

      <SheetRoot open={cancelOpen} onOpenChange={setCancelOpen}>
        <BottomSheet title="Batalkan pesanan">
          <div className="flex flex-col gap-3 px-4 pt-2 pb-5">
            <p className="text-[17px] font-bold text-ink-900">Batalkan pesanan?</p>
            <p className="text-sm text-ink-500">Pesanan {order.code} dibatalkan dan stok dilepas.</p>
            <div className="flex gap-2.5">
              <MButton variant="outline" className="flex-1" onClick={() => setCancelOpen(false)}>
                Kembali
              </MButton>
              <MButton
                variant="danger"
                className="flex-1"
                loading={actions.cancel.isPending}
                onClick={() =>
                  actions.cancel.mutate({ code: order.code }, { onSuccess: () => setCancelOpen(false) })
                }
              >
                Batalkan pesanan
              </MButton>
            </div>
          </div>
        </BottomSheet>
      </SheetRoot>

      <SheetRoot open={zoom} onOpenChange={setZoom}>
        <BottomSheet title="Bukti transfer">
          <div className="flex h-12 items-center gap-1 pr-2 pl-4">
            <p className="flex-1 text-[17px] font-bold text-ink-900">Bukti transfer</p>
            <SheetClose aria-label="Tutup" className="flex size-10 items-center justify-center rounded-full text-ink-500">
              <XIcon className="size-6" strokeWidth={1.8} />
            </SheetClose>
          </div>
          <div className="overflow-auto px-4 pb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {proof?.proofUrl ? <img src={proof.proofUrl} alt="Bukti transfer" className="w-full rounded-xl" /> : null}
          </div>
        </BottomSheet>
      </SheetRoot>
    </div>
  );
}
