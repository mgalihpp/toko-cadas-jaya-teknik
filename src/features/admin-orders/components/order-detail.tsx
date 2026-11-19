"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  BanknoteIcon,
  CheckCheckIcon,
  PackageIcon,
  XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  EmptyState,
  ErrorState,
  ORDER_STATUS_LABEL,
  OrderStatusBadge,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { useTRPC } from "@/trpc/client";
import { formatDayTime } from "../format";
import { useOrderActions } from "../hooks/use-order-actions";
import { FULFILLMENT_LABEL, PAYMENT_METHOD_LABEL } from "../labels";
import type { AdminOrderDetail as Order } from "../types";
import { ConfirmAction } from "./confirm-action";
import { PaymentStatusBadge } from "./payment-status-badge";
import { ProofPanel } from "./proof-panel";

const UNPAID = new Set<Order["status"]>(["menunggu_pembayaran", "menunggu_konfirmasi"]);

export function AdminOrderDetail({ code }: { code: string }) {
  const trpc = useTRPC();
  const query = useQuery(trpc.admin.orders.byCode.queryOptions({ code }));

  if (query.isPending) return <DetailSkeleton />;
  if (query.isError) {
    if (query.error.data?.code === "NOT_FOUND") {
      return (
        <EmptyState
          icon={PackageIcon}
          title="Pesanan tidak ditemukan"
          description={`Tidak ada pesanan dengan kode ${code}.`}
          action={
            <Button asChild variant="outline">
              <Link href="/admin/pesanan">Kembali ke daftar pesanan</Link>
            </Button>
          }
        />
      );
    }
    return <ErrorState onRetry={() => query.refetch()} />;
  }

  const order = query.data;
  const latestProof = order.payments.find((p) => p.method === "transfer" && p.proofUrl);

  return (
    <div className="flex flex-col gap-6">
      <OrderHeader order={order} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          {latestProof ? <ProofPanel order={order} payment={latestProof} /> : null}
          {order.paymentMethod === "tunai" && order.status === "menunggu_pembayaran" ? (
            <CashPanel order={order} />
          ) : null}
          {order.paymentMethod === "transfer" &&
          order.status === "menunggu_pembayaran" &&
          !latestProof ? (
            <Notice>
              Pelanggan belum mengunggah bukti transfer.
              {order.expiresAt ? ` Batas pembayaran ${formatDateTime(order.expiresAt)}.` : null}
            </Notice>
          ) : null}
          <PaymentHistory order={order} />
        </div>
        <OrderInfo order={order} />
      </div>
    </div>
  );
}

function OrderHeader({ order }: { order: Order }) {
  const actions = useOrderActions();
  const [cancelNote, setCancelNote] = useState("");
  const latestProof = order.payments.find((p) => p.proofUrl);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <Button asChild variant="outline" size="icon-lg" className="shrink-0 bg-white">
          <Link href="/admin/pesanan" aria-label="Kembali ke daftar pesanan">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-ink-900">
              {order.code}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-[13px] text-ink-500">
            {order.recipientName}, dibuat {formatDateTime(order.createdAt)}
            {latestProof ? `, bukti masuk ${formatDayTime(latestProof.createdAt)}` : null}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 sm:justify-end">
        {order.status === "dibayar" ? (
          <ConfirmAction
            title="Tandai pesanan diproses?"
            description="Pesanan akan berstatus Diproses, artinya barang sedang disiapkan."
            confirmLabel="Tandai diproses"
            pending={actions.advance.isPending}
            onConfirm={() => actions.advance.mutateAsync({ code: order.code, to: "diproses" })}
            trigger={
              <Button variant="outline" className="bg-white">
                <PackageIcon />
                Tandai diproses
              </Button>
            }
          />
        ) : null}
        {order.status === "dibayar" || order.status === "diproses" ? (
          <ConfirmAction
            title="Tandai pesanan selesai?"
            description="Gunakan setelah barang dikirim atau diambil pelanggan. Status selesai tidak dapat diubah lagi."
            confirmLabel="Tandai selesai"
            confirmClassName="bg-success text-white hover:bg-success/90"
            pending={actions.advance.isPending}
            onConfirm={() => actions.advance.mutateAsync({ code: order.code, to: "selesai" })}
            trigger={
              <Button className="bg-success text-white hover:bg-success/90">
                <CheckCheckIcon />
                Tandai selesai
              </Button>
            }
          />
        ) : null}
        {UNPAID.has(order.status) ? (
          <ConfirmAction
            title="Batalkan pesanan?"
            description="Pesanan dibatalkan dan stok yang dikunci dilepas kembali. Tindakan ini tidak dapat dibatalkan."
            confirmLabel="Batalkan pesanan"
            destructive
            pending={actions.cancel.isPending}
            onOpenChange={(open) => {
              if (!open) setCancelNote("");
            }}
            onConfirm={() =>
              actions.cancel.mutateAsync({
                code: order.code,
                note: cancelNote.trim() || undefined,
              })
            }
            trigger={
              <Button
                variant="outline"
                className="border-error-border bg-white text-error hover:bg-error-soft hover:text-error"
              >
                <XCircleIcon />
                Batalkan pesanan
              </Button>
            }
          >
            <Field>
              <FieldLabel htmlFor="cancel-note">Alasan (opsional)</FieldLabel>
              <Textarea
                id="cancel-note"
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                placeholder="Contoh: pelanggan meminta pembatalan"
                maxLength={300}
                rows={3}
              />
              <FieldDescription>Tercatat di riwayat status pesanan.</FieldDescription>
            </Field>
          </ConfirmAction>
        ) : null}
      </div>
    </div>
  );
}

function CashPanel({ order }: { order: Order }) {
  const actions = useOrderActions();
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-warning-border bg-warning-soft p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-semibold text-ink-900">Pembayaran tunai</h2>
        <p className="text-sm text-ink-600">
          Catat setelah pelanggan membayar {formatRupiah(order.total)} di toko.
          {order.expiresAt ? ` Batas pembayaran ${formatDateTime(order.expiresAt)}.` : null}
        </p>
      </div>
      <ConfirmAction
        title="Catat pembayaran tunai?"
        description={`Pesanan ${order.code} akan berstatus Dibayar dengan nominal ${formatRupiah(order.total)}. Stok dicatat terjual.`}
        confirmLabel="Catat pembayaran"
        pending={actions.recordCash.isPending}
        onConfirm={() => actions.recordCash.mutateAsync({ code: order.code })}
        trigger={
          <Button className="shrink-0">
            <BanknoteIcon />
            Catat tunai
          </Button>
        }
      />
    </section>
  );
}

function PaymentHistory({ order }: { order: Order }) {
  if (order.payments.length === 0) return null;
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-ink-200 bg-white p-4 sm:p-6">
      <h2 className="text-[13px] font-semibold text-ink-500">Pembayaran</h2>
      <ul className="flex flex-col divide-y divide-ink-100">
        {order.payments.map((payment) => (
          <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-ink-900">
                {PAYMENT_METHOD_LABEL[payment.method]} {formatRupiah(payment.amount)}
              </span>
              <span className="text-xs text-ink-500">
                {formatDateTime(payment.createdAt)}
                {payment.confirmedAt ? `, diputuskan ${formatDateTime(payment.confirmedAt)}` : null}
              </span>
              {payment.ownerNote ? (
                <span className="text-xs text-ink-600">Catatan: {payment.ownerNote}</span>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              {payment.proofUrl ? (
                <a
                  href={payment.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-info hover:underline"
                >
                  Lihat bukti
                </a>
              ) : null}
              <PaymentStatusBadge status={payment.status} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function OrderInfo({ order }: { order: Order }) {
  const logs = [...order.statusLogs].reverse();
  return (
    <aside className="flex flex-col divide-y divide-ink-200 rounded-2xl border border-ink-200 bg-white">
      <Block title="Barang">
        <ul className="flex flex-col gap-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex flex-col">
              <span className="text-[13px] font-semibold text-ink-900">{item.productName}</span>
              <span className="text-xs text-ink-500">
                {item.quantity} x {formatRupiah(item.unitPrice)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm font-semibold text-ink-900">Total</span>
          <span className="font-heading text-lg font-bold text-ink-900">
            {formatRupiah(order.total)}
          </span>
        </div>
      </Block>
      <Block title="Pelanggan">
        <span className="text-sm font-semibold text-ink-900">{order.recipientName}</span>
        <span className="text-sm text-ink-600">
          {[order.phone, order.user?.email].filter(Boolean).join(", ")}
        </span>
        {order.user && order.user.name !== order.recipientName ? (
          <span className="text-xs text-ink-500">Akun: {order.user.name}</span>
        ) : null}
      </Block>
      <Block title={order.fulfillment === "kirim" ? "Pengiriman" : "Pengambilan"}>
        <span className="text-sm text-ink-600">
          {order.fulfillment === "kirim"
            ? (order.address ?? "Alamat belum diisi")
            : FULFILLMENT_LABEL.ambil}
        </span>
        <span className="text-xs text-ink-500">
          Pembayaran {PAYMENT_METHOD_LABEL[order.paymentMethod].toLowerCase()}
        </span>
      </Block>
      <Block title="Riwayat">
        <ol className="flex flex-col gap-3">
          {logs.map((log) => (
            <li key={log.id} className="flex flex-col">
              <span className="text-[13px] text-ink-900">
                {log.fromStatus === null
                  ? "Pesanan dibuat, stok dikunci"
                  : ORDER_STATUS_LABEL[log.toStatus]}
              </span>
              {log.note ? <span className="text-xs text-ink-600">{log.note}</span> : null}
              <span className="text-xs text-ink-500">{formatDayTime(log.createdAt)}</span>
            </li>
          ))}
        </ol>
      </Block>
    </aside>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 p-4 sm:p-5">
      <h2 className="text-[13px] font-semibold text-ink-500">{title}</h2>
      {children}
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-warning-border bg-warning-soft px-4 py-3 text-sm font-medium text-warning">
      {children}
    </p>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-12 w-72" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-96 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </div>
  );
}
