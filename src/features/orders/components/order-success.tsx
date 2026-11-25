"use client";

import { CheckIcon, LandmarkIcon, ReceiptTextIcon, StoreIcon } from "lucide-react";
import { MLink } from "@/components/mobile/m-button";
import { OrderStatusBadge } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { useOrder } from "../hooks/use-orders";

const CONFETTI = ["#FFC93C", "#fff", "#7FD6FF", "#9ACBF5", "#FF9AAE"];

function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden">
      {Array.from({ length: 26 }, (_, i) => {
        const size = 6 + ((i * 5) % 6);
        return (
          <span
            key={i}
            className="absolute top-0"
            style={{
              left: `${(i * 37) % 100}%`,
              width: size,
              height: size + (i % 3) * 3,
              background: CONFETTI[i % CONFETTI.length],
              borderRadius: i % 3 === 0 ? "50%" : 2,
              animation: `cjt-fall ${2.2 + (i % 5) * 0.4}s ease-in ${(i % 7) * 0.25}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}

export function OrderSuccess({ code }: { code: string }) {
  const { data: order, isPending } = useOrder(code);

  if (isPending || !order) {
    return (
      <div role="status" className="flex flex-1 flex-col">
        <Skeleton className="h-[300px] rounded-none" />
      </div>
    );
  }

  const transfer = order.paymentMethod === "transfer";
  const awaitingPay = transfer && order.status === "menunggu_pembayaran";
  const first = order.items[0];
  const more = order.items.length - 1;

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative flex h-[300px] flex-col items-center justify-center gap-2.5 overflow-hidden bg-gradient-to-b from-brand-700 to-brand-500 px-4 pb-8">
        <Confetti />
        <span className="relative flex size-[84px] animate-[cjt-pop_.6s_ease-out] items-center justify-center rounded-full border-4 border-white">
          <CheckIcon className="size-11 text-white" strokeWidth={3} />
        </span>
        <h1 className="relative text-[22px] font-bold text-white">Pesanan berhasil dibuat!</h1>
        <p className="relative text-sm text-[#CFE4F6]">Kode pesanan {order.code}</p>
        <p className="relative text-[30px] leading-[1.2] font-bold text-white">{formatRupiah(order.total)}</p>
      </div>

      <section className="relative z-10 mx-3 -mt-[30px] flex flex-col gap-2 rounded-xl bg-white p-3 shadow-[0_6px_20px_rgba(10,40,70,.12)]">
        <div className="flex items-center gap-2">
          <StoreIcon className="size-5 text-brand-600" strokeWidth={1.8} />
          <p className="flex-1 text-[15px] font-bold text-ink-900">Cadas Jaya Teknik</p>
          <OrderStatusBadge status={order.status} />
        </div>
        {awaitingPay && order.expiresAt ? (
          <p className="text-[13px] text-ink-500">
            Transfer sebelum {formatDateTime(order.expiresAt)}. Kalau lewat, pesanan batal dan stok dilepas.
          </p>
        ) : null}
        {first ? (
          <p className="text-[13px] font-medium text-ink-900">
            {first.productName}
            {more > 0 ? ` + ${more} produk lain` : ""}
          </p>
        ) : null}
      </section>

      <div className="flex flex-col gap-2.5 p-3 pt-4">
        {awaitingPay ? (
          <MLink href={`/pesanan/${order.code}/bayar`} size="lg" block>
            <LandmarkIcon className="size-[18px]" />
            Bayar sekarang
          </MLink>
        ) : null}
        <MLink href={`/pesanan/${order.code}`} variant="outline" size="lg" block>
          <ReceiptTextIcon className="size-[18px]" />
          Lihat pesanan saya
        </MLink>
        <MLink href="/produk" variant="secondary" block className="h-[46px]">
          Lanjut belanja
        </MLink>
      </div>
    </div>
  );
}
