"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Hourglass,
  Store,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { canCancel, canUploadProof } from "../constants";
import {
  useCancelOrder,
  useOrder,
  useStoreSettings,
} from "../hooks/use-orders";
import type { OrderDetail as Order } from "../types";
import { OrderStatusBadge } from "@/components/shared";
import { OrderTimeline } from "./order-timeline";
import { PaymentCountdown } from "./payment-countdown";
import { PaymentProofUpload } from "./payment-proof-upload";

export function OrderDetail({ code }: { code: string }) {
  const { data: order, isPending, isError, error, refetch, isRefetching } =
    useOrder(code);
  const onExpire = useCallback(() => void refetch(), [refetch]);

  if (isPending) return <OrderDetailSkeleton />;

  if (isError) {
    const notFound = error.data?.code === "NOT_FOUND";
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <Empty className="border border-border">
          <EmptyHeader>
            {notFound ? (
              <p className="font-heading text-7xl font-bold text-brand-600">404</p>
            ) : (
              <EmptyMedia variant="icon">
                <WifiOff />
              </EmptyMedia>
            )}
            <EmptyTitle>
              {notFound ? "Pesanan tidak ditemukan" : "Gagal memuat pesanan"}
            </EmptyTitle>
            <EmptyDescription>
              {notFound
                ? `Tidak ada pesanan dengan kode ${code} di akunmu.`
                : "Detail pesanan belum bisa dimuat. Periksa internet lalu coba lagi."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            {!notFound && (
              <Button onClick={() => refetch()} disabled={isRefetching}>
                {isRefetching ? "Memuat..." : "Coba lagi"}
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/pesanan">Kembali ke pesanan saya</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  const showCountdown =
    canUploadProof(order) && order.expiresAt !== null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-10">
      <Link
        href="/pesanan"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft className="size-4" />
        Pesanan saya
      </Link>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-ink-900 sm:text-4xl">
            {order.code}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-ink-500">Dibuat {formatDateTime(order.createdAt)}</p>
      </div>

      {showCountdown && order.expiresAt && (
        <div className="mt-5">
          <PaymentCountdown expiresAt={order.expiresAt} onExpire={onExpire} />
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)_340px] lg:gap-10">
        <OrderTimeline order={order} />
        <PaymentSection order={order} />
        <OrderSummary order={order} />
      </div>
    </div>
  );
}

function PaymentSection({ order }: { order: Order }) {
  const latestPayment = order.payments[0];
  const rejected =
    order.status === "menunggu_pembayaran" && latestPayment?.status === "ditolak"
      ? latestPayment
      : null;

  if (order.paymentMethod === "tunai") {
    return (
      <section className="min-w-0">
        <h2 className="text-[22px] font-semibold text-ink-900">Pembayaran tunai</h2>
        <InfoBox icon={<Store className="size-5" />}>
          {order.status === "menunggu_pembayaran"
            ? order.fulfillment === "ambil"
              ? "Bayar tunai di toko saat mengambil pesanan. Tunjukkan kode pesanan ini ke kasir."
              : "Bayar tunai kepada kurir saat pesanan diterima."
            : order.status === "dibatalkan"
              ? "Pesanan ini sudah dibatalkan."
              : "Pembayaran tunai sudah diterima toko."}
        </InfoBox>
      </section>
    );
  }

  if (canUploadProof(order)) {
    return (
      <section className="flex min-w-0 flex-col gap-4">
        <h2 className="text-[22px] font-semibold text-ink-900">Upload bukti transfer</h2>
        {rejected && (
          <div
            role="alert"
            className="flex gap-3 rounded-xl border border-error-border bg-error-soft px-4 py-3"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-error" />
            <div>
              <p className="text-sm font-bold text-error">Bukti sebelumnya ditolak</p>
              {rejected.ownerNote && (
                <p className="mt-0.5 text-[13px] text-ink-800">
                  Catatan Owner: {rejected.ownerNote}
                </p>
              )}
            </div>
          </div>
        )}
        <BankAccounts total={order.total} />
        <PaymentProofUpload code={order.code} />
      </section>
    );
  }

  const accepted = order.payments.find((p) => p.status === "diterima");
  const waiting = order.status === "menunggu_konfirmasi" ? latestPayment : null;
  const proof = waiting ?? accepted;

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <h2 className="text-[22px] font-semibold text-ink-900">Bukti transfer</h2>
      {order.status === "menunggu_konfirmasi" ? (
        <InfoBox icon={<Hourglass className="size-5" />} tone="info">
          Bukti transfer sudah dikirim dan sedang diperiksa Owner. Status pesanan
          akan berubah setelah pembayaran dikonfirmasi.
        </InfoBox>
      ) : order.status === "dibatalkan" ? (
        <InfoBox icon={<AlertCircle className="size-5" />} tone="error">
          Pesanan ini sudah dibatalkan.
        </InfoBox>
      ) : (
        <InfoBox icon={<CheckCircle2 className="size-5" />} tone="success">
          Pembayaran sudah dikonfirmasi Owner.
        </InfoBox>
      )}
      {proof?.proofUrl && (
        <a
          href={proof.proofUrl}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden rounded-xl border border-border bg-ink-50"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proof.proofUrl}
            alt={`Bukti transfer pesanan ${order.code}`}
            className="max-h-96 w-full object-contain"
          />
          <span className="block border-t border-border px-4 py-2 text-xs text-ink-500">
            Diunggah {formatDateTime(proof.createdAt)}
          </span>
        </a>
      )}
    </section>
  );
}

function InfoBox({
  icon,
  tone = "neutral",
  children,
}: {
  icon: React.ReactNode;
  tone?: "neutral" | "info" | "success" | "error";
  children: React.ReactNode;
}) {
  const toneClass = {
    neutral: "border-border bg-ink-50 text-ink-700",
    info: "border-info-border bg-info-soft text-info",
    success: "border-success-border bg-success-soft text-success",
    error: "border-error-border bg-error-soft text-error",
  }[tone];
  return (
    <div className={`mt-4 flex gap-3 rounded-xl border px-4 py-4 first:mt-0 ${toneClass}`}>
      <span className="shrink-0">{icon}</span>
      <p className="text-sm text-ink-800">{children}</p>
    </div>
  );
}

function BankAccounts({ total }: { total: number }) {
  const { data, isPending, isError } = useStoreSettings();

  if (isPending) return <Skeleton className="h-20 w-full rounded-xl" />;
  if (isError || data.bankAccounts.length === 0) {
    return (
      <InfoBox icon={<AlertCircle className="size-5" />}>
        Info rekening belum tersedia. Hubungi toko untuk nomor rekening tujuan.
      </InfoBox>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {data.bankAccounts.map((acc) => (
        <div
          key={`${acc.bank}-${acc.number}`}
          className="flex flex-wrap items-center gap-4 rounded-xl bg-ink-50 px-4 py-4 sm:px-5"
        >
          <span className="flex h-9 min-w-12 items-center justify-center rounded-lg bg-info px-2 text-[13px] font-extrabold text-white">
            {acc.bank}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-semibold text-ink-900 tabular-nums">
                {acc.number}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Salin nomor rekening ${acc.bank}`}
                onClick={() =>
                  navigator.clipboard
                    .writeText(acc.number.replace(/\s/g, ""))
                    .then(() => toast.success("Nomor rekening disalin"))
                    .catch(() => toast.error("Gagal menyalin nomor rekening"))
                }
              >
                <Copy />
              </Button>
            </div>
            <p className="text-[13px] text-ink-600">a.n. {acc.holder}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-500">Jumlah transfer</p>
            <p className="text-xl font-bold text-brand-700">{formatRupiah(total)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderSummary({ order }: { order: Order }) {
  return (
    <aside className="flex min-w-0 flex-col">
      <SummaryBlock title="Barang">
        <ul className="flex flex-col gap-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink-900">{item.productName}</p>
                <p className="text-xs text-ink-500">
                  {item.quantity} x {formatRupiah(item.unitPrice)}
                </p>
              </div>
              <span className="text-[13px] font-semibold whitespace-nowrap text-ink-900">
                {formatRupiah(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm font-semibold text-ink-900">Total</span>
          <span className="text-lg font-bold text-ink-900">{formatRupiah(order.total)}</span>
        </div>
      </SummaryBlock>

      <SummaryBlock title={order.fulfillment === "kirim" ? "Pengiriman" : "Ambil di toko"}>
        <p className="text-sm font-semibold text-ink-900">
          {order.recipientName}, {order.phone}
        </p>
        <p className="mt-1 text-sm text-ink-600">
          {order.fulfillment === "kirim"
            ? order.address
            : "Pesanan diambil langsung di toko Cadas Jaya Teknik."}
        </p>
      </SummaryBlock>

      <SummaryBlock title="Pembayaran">
        <p className="text-sm font-semibold text-ink-900">
          {order.paymentMethod === "transfer" ? "Transfer bank" : "Tunai"}
        </p>
      </SummaryBlock>

      {canCancel(order) && <CancelOrderButton code={order.code} />}
    </aside>
  );
}

function SummaryBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border py-5 first:pt-0">
      <h2 className="mb-3 font-sans text-[13px] font-semibold text-ink-500">{title}</h2>
      {children}
    </section>
  );
}

function CancelOrderButton({ code }: { code: string }) {
  const cancel = useCancelOrder();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className="mt-4 w-fit px-0 text-sm font-semibold text-error hover:bg-transparent hover:text-error/80"
          disabled={cancel.isPending}
        >
          <AlertCircle /> Batalkan pesanan
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Batalkan pesanan {code}?</AlertDialogTitle>
          <AlertDialogDescription>
            Stok barang akan dilepas dan pesanan tidak bisa dilanjutkan lagi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Tidak jadi</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() =>
              cancel.mutate(
                { code },
                {
                  onSuccess: () => toast.success("Pesanan dibatalkan"),
                  onError: (err) => toast.error(err.message),
                }
              )
            }
          >
            Ya, batalkan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function OrderDetailSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-10"
      aria-busy="true"
      aria-label="Memuat pesanan"
    >
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-4 h-9 w-64" />
      <Skeleton className="mt-5 h-14 w-full rounded-xl" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)_340px] lg:gap-10">
        <div className="space-y-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-40" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}
