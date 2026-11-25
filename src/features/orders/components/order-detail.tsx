"use client";

import {
  CheckIcon,
  ClockIcon,
  PhoneIcon,
  TriangleAlertIcon,
  UploadIcon,
  WifiOffIcon,
  XIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MButton, MLink } from "@/components/mobile/m-button";
import { BottomSheet, SheetClose, SheetRoot } from "@/components/mobile/sheet";
import { StickyBar } from "@/components/mobile/sticky-bar";
import { BackButton } from "@/components/mobile/top-bar";
import { EmptyState } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductThumb } from "@/features/cart";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { canCancel, canUploadProof } from "../constants";
import { useCancelOrder, useOrder } from "../hooks/use-orders";
import type { OrderDetail as Order, OrderStatus } from "../types";

type Step = { key: string; label: string; note?: string; state: "done" | "current" | "upcoming" | "failed" };

const FLOW: OrderStatus[] = ["menunggu_pembayaran", "menunggu_konfirmasi", "dibayar", "diproses", "selesai"];

function lastLogAt(order: Order, status: OrderStatus) {
  return order.statusLogs.filter((l) => l.toStatus === status).at(-1)?.createdAt;
}

function buildSteps(order: Order, rejected: Order["payments"][number] | undefined): Step[] {
  const transfer = order.paymentMethod === "transfer";
  const steps: Step[] = [
    { key: "dibuat", label: "Pesanan dibuat", note: formatDateTime(order.createdAt), state: "done" },
  ];

  if (order.status === "dibatalkan") {
    for (const s of ["menunggu_konfirmasi", "dibayar", "diproses"] as const) {
      if (s === "menunggu_konfirmasi" && !transfer) continue;
      const at = lastLogAt(order, s);
      if (at) {
        steps.push({
          key: s,
          label: s === "menunggu_konfirmasi" ? "Bukti diunggah" : s === "dibayar" ? "Dibayar" : "Diproses",
          note: formatDateTime(at),
          state: "done",
        });
      }
    }
    steps.push({
      key: "dibatalkan",
      label: "Dibatalkan",
      note: formatDateTime(lastLogAt(order, "dibatalkan") ?? order.createdAt),
      state: "failed",
    });
    return steps;
  }

  const idx = FLOW.indexOf(order.status);
  if (transfer) {
    if (rejected) {
      steps.push({
        key: "ditolak",
        label: "Bukti ditolak",
        note: formatDateTime(rejected.confirmedAt ?? rejected.createdAt),
        state: "failed",
      });
      steps.push({ key: "ulang", label: "Unggah ulang bukti", note: "Menunggu kamu", state: "current" });
    } else if (idx >= 1) {
      steps.push({
        key: "bukti",
        label: "Bukti diunggah",
        note: formatDateTime(lastLogAt(order, "menunggu_konfirmasi") ?? order.createdAt),
        state: "done",
      });
      steps.push({
        key: "konfirmasi",
        label: "Menunggu konfirmasi Owner",
        note: idx === 1 ? "Sedang dicek" : undefined,
        state: idx === 1 ? "current" : "done",
      });
    } else {
      steps.push({ key: "bayar", label: "Menunggu pembayaran", note: "Unggah bukti transfer", state: "current" });
    }
  } else if (idx === 0) {
    steps.push({ key: "bayar", label: "Menunggu pembayaran", note: "Bayar tunai saat serah terima", state: "current" });
  }

  for (const [key, label, at] of [
    ["dibayar", "Dibayar", FLOW.indexOf("dibayar")],
    ["diproses", "Diproses", FLOW.indexOf("diproses")],
    ["selesai", "Selesai", FLOW.indexOf("selesai")],
  ] as const) {
    const done = idx >= at;
    const current = idx === at && key !== "selesai";
    const when = lastLogAt(order, key as OrderStatus);
    steps.push({
      key,
      label,
      note: done && when ? formatDateTime(when) : undefined,
      state: key === "selesai" && done ? "done" : current ? "current" : done ? "done" : "upcoming",
    });
  }
  return steps;
}

function Timeline({ steps }: { steps: Step[] }) {
  return (
    <ol className="flex flex-col pt-1.5">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
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
            {last ? null : (
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
  );
}

function Banner({ order, rejected }: { order: Order; rejected: Order["payments"][number] | undefined }) {
  const note = rejected?.ownerNote?.trim();
  const config = rejected
    ? {
        tone: "border-error-border bg-error-soft",
        title: "Bukti ditolak",
        titleTone: "text-error",
        icon: <TriangleAlertIcon className="size-5 shrink-0 text-error" strokeWidth={2} />,
        body: `Bukti transfer ditolak.${note ? ` Catatan Owner: "${note}"` : ""} Unggah ulang bukti yang benar.`,
      }
    : order.status === "menunggu_konfirmasi"
      ? {
          tone: "border-info-border bg-info-soft",
          title: "Menunggu konfirmasi",
          titleTone: "text-brand-700",
          icon: <ClockIcon className="size-5 shrink-0 text-brand-700" strokeWidth={2} />,
          body: "Buktimu sudah terkirim. Owner akan mengecek dan mengonfirmasi pembayaran.",
        }
      : order.status === "menunggu_pembayaran"
        ? {
            tone: "border-warning-border bg-warning-soft",
            title: "Menunggu pembayaran",
            titleTone: "text-warning",
            icon: <ClockIcon className="size-5 shrink-0 text-warning" strokeWidth={2} />,
            body:
              order.paymentMethod === "transfer" && order.expiresAt
                ? `Unggah bukti transfer sebelum ${formatDateTime(order.expiresAt)} atau pesanan otomatis dibatalkan.`
                : "Bayar tunai saat serah terima barang.",
          }
        : order.status === "dibatalkan"
          ? {
              tone: "border-error-border bg-error-soft",
              title: "Pesanan dibatalkan",
              titleTone: "text-error",
              icon: <XIcon className="size-5 shrink-0 text-error" strokeWidth={2} />,
              body: "Pesanan ini dibatalkan dan stok sudah dilepas.",
            }
          : {
              tone: "border-success-border bg-success-soft",
              title:
                order.status === "dibayar"
                  ? "Pembayaran dikonfirmasi"
                  : order.status === "diproses"
                    ? "Pesanan diproses"
                    : "Pesanan selesai",
              titleTone: "text-success",
              icon: <CheckIcon className="size-5 shrink-0 text-success" strokeWidth={2.4} />,
              body:
                order.status === "selesai"
                  ? "Terima kasih sudah berbelanja di Cadas Jaya Teknik."
                  : "Owner sedang menyiapkan pesananmu.",
            };
  return (
    <div className={cn("flex gap-2.5 rounded-[10px] border p-3", config.tone)}>
      {config.icon}
      <div className="flex flex-col gap-0.5">
        <p className={cn("text-sm font-bold", config.titleTone)}>{config.title}</p>
        <p className="text-[13px] text-ink-900">{config.body}</p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <p className="flex-1 text-sm text-ink-500">{label}</p>
      <div className="text-sm font-medium text-ink-900">{children}</div>
    </div>
  );
}

function Header({ code }: { code?: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-0.5 border-b border-ink-200 bg-white px-1">
      <BackButton href="/pesanan" />
      <h1 className="flex-1 text-[17px] font-bold text-ink-900">Detail pesanan</h1>
      {code ? (
        <span className="mr-3 rounded-md bg-toast px-2 py-[3px] text-[11px] font-bold text-white">{code}</span>
      ) : null}
    </header>
  );
}

export function OrderDetail({ code }: { code: string }) {
  const { data: order, isPending, isError, error, refetch } = useOrder(code);
  const trpc = useTRPC();
  const { data: settings } = useQuery(trpc.settings.get.queryOptions());
  const cancel = useCancelOrder();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);

  if (isPending) {
    return (
      <div className="flex flex-1 flex-col">
        <Header />
        <div role="status" className="flex flex-col gap-1.5">
          <Skeleton className="h-24 rounded-none" />
          <Skeleton className="h-64 rounded-none" />
          <Skeleton className="h-40 rounded-none" />
        </div>
      </div>
    );
  }

  if (isError) {
    const notFound = error.data?.code === "NOT_FOUND";
    return (
      <div className="flex flex-1 flex-col">
        <Header />
        <EmptyState
          icon={notFound ? TriangleAlertIcon : WifiOffIcon}
          title={notFound ? "Pesanan tidak ditemukan" : "Koneksi terputus"}
          description={
            notFound
              ? "Pesanan ini tidak ada atau bukan milik akunmu."
              : "Detail pesanan belum bisa dimuat. Periksa internet lalu coba lagi."
          }
          action={
            notFound ? (
              <MLink href="/pesanan" className="h-[46px] px-6">
                Lihat pesanan saya
              </MLink>
            ) : (
              <MButton className="px-7" onClick={() => refetch()}>
                Coba lagi
              </MButton>
            )
          }
        />
      </div>
    );
  }

  const latest = order.payments[0];
  const rejected =
    order.status === "menunggu_pembayaran" && latest?.status === "ditolak" ? latest : undefined;
  const proof = order.payments.find((p) => p.proofUrl)?.proofUrl ?? null;
  const steps = buildSteps(order, rejected);
  const phone = settings?.phone.trim();
  const contact = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "/kontak";

  return (
    <div className="flex flex-1 flex-col pb-[76px]">
      <Header code={order.code} />
      <section className="bg-white p-3">
        <Banner order={order} rejected={rejected} />
      </section>
      <div className="h-1.5" />
      <section className="flex flex-col gap-1.5 bg-white p-3">
        <h2 className="text-[15px] font-bold text-ink-900">Riwayat status</h2>
        <Timeline steps={steps} />
      </section>
      <div className="h-1.5" />
      <section className="flex flex-col gap-2.5 bg-white p-3">
        <h2 className="text-[15px] font-bold text-ink-900">Produk</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-2.5">
            <ProductThumb src={item.image} alt="" className="size-14" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="line-clamp-2 text-[13px] font-medium text-ink-900">{item.productName}</p>
              <p className="text-xs text-ink-500">
                {formatRupiah(item.unitPrice)} · x{item.quantity}
              </p>
            </div>
            <p className="text-sm font-bold text-ink-900">{formatRupiah(item.unitPrice * item.quantity)}</p>
          </div>
        ))}
      </section>
      <div className="h-1.5" />
      <section className="flex flex-col gap-2.5 bg-white p-3">
        <h2 className="text-[15px] font-bold text-ink-900">Pembayaran</h2>
        <Row label="Metode">{order.paymentMethod === "transfer" ? "Transfer bank" : "Tunai"}</Row>
        <Row label="Pengambilan">{order.fulfillment === "ambil" ? "Ambil di toko" : "Dikirim"}</Row>
        {order.fulfillment === "kirim" && order.address ? (
          <Row label="Alamat">
            <span className="block max-w-[200px] text-right">{order.address}</span>
          </Row>
        ) : null}
        <Row label="Total">
          <span className="text-base font-bold text-brand-700">{formatRupiah(order.total)}</span>
        </Row>
        {order.paymentMethod === "transfer" ? (
          <Row label="Bukti transfer">
            {proof ? (
              <button
                type="button"
                aria-label="Lihat bukti transfer"
                onClick={() => setProofOpen(true)}
                className="size-11 overflow-hidden rounded-lg bg-toast"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={proof} alt="" className="size-full object-cover" />
              </button>
            ) : (
              <span className="text-ink-500">Belum ada</span>
            )}
          </Row>
        ) : null}
      </section>

      <StickyBar>
        {rejected || canUploadProof(order) ? (
          <MLink href={`/pesanan/${order.code}/bayar`} size="lg" block>
            <UploadIcon className="size-[18px]" />
            {rejected ? "Unggah ulang bukti" : "Bayar sekarang"}
          </MLink>
        ) : (
          <a href={contact} className="flex h-[50px] flex-1 items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-brand-600 bg-white text-[15px] font-bold text-brand-700">
            <PhoneIcon className="size-[18px]" />
            Hubungi toko
          </a>
        )}
        {canCancel(order) && !rejected ? (
          <MButton variant="dangerOutline" size="lg" className="flex-1" onClick={() => setCancelOpen(true)}>
            Batalkan pesanan
          </MButton>
        ) : null}
      </StickyBar>

      <SheetRoot open={cancelOpen} onOpenChange={setCancelOpen}>
        <BottomSheet title="Batalkan pesanan">
          <div className="flex flex-col gap-3 px-4 pt-2 pb-5">
            <p className="text-[17px] font-bold text-ink-900">Batalkan pesanan?</p>
            <p className="text-sm text-ink-500">
              Pesanan {order.code} akan dibatalkan dan stok dilepas. Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-2.5">
              <MButton variant="outline" className="flex-1" onClick={() => setCancelOpen(false)}>
                Kembali
              </MButton>
              <MButton
                variant="danger"
                className="flex-1"
                loading={cancel.isPending}
                onClick={() =>
                  cancel.mutate(
                    { code: order.code },
                    {
                      onSuccess: () => {
                        toast.success("Pesanan dibatalkan");
                        setCancelOpen(false);
                      },
                      onError: (e) => toast.error(e.message),
                    },
                  )
                }
              >
                Batalkan pesanan
              </MButton>
            </div>
          </div>
        </BottomSheet>
      </SheetRoot>

      <SheetRoot open={proofOpen} onOpenChange={setProofOpen}>
        <BottomSheet title="Bukti transfer">
          <div className="flex h-12 items-center gap-1 pr-2 pl-4">
            <p className="flex-1 text-[17px] font-bold text-ink-900">Bukti transfer</p>
            <SheetClose aria-label="Tutup" className="flex size-10 items-center justify-center rounded-full text-ink-500">
              <XIcon className="size-6" strokeWidth={1.8} />
            </SheetClose>
          </div>
          <div className="overflow-auto px-4 pb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {proof ? <img src={proof} alt="Bukti transfer" className="w-full rounded-xl" /> : null}
          </div>
        </BottomSheet>
      </SheetRoot>
    </div>
  );
}
