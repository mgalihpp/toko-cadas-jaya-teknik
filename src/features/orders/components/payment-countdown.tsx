"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";

function remaining(target: number, now: number) {
  const total = Math.max(0, Math.floor((target - now) / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))} : ${pad(Math.floor((total % 3600) / 60))} : ${pad(total % 60)}`;
}

export function PaymentCountdown({
  expiresAt,
  onExpire,
}: {
  expiresAt: Date;
  onExpire?: () => void;
}) {
  const target = new Date(expiresAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const expired = now !== null && now >= target;
  useEffect(() => {
    if (expired) onExpire?.();
  }, [expired, onExpire]);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-warning-border bg-warning-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="flex items-start gap-2.5 text-sm font-medium text-ink-800">
        <Clock className="mt-0.5 size-4 shrink-0 text-warning" />
        Unggah bukti transfer sebelum {formatDateTime(expiresAt)} atau pesanan
        otomatis dibatalkan
      </p>
      <span
        className="font-mono text-lg font-bold whitespace-nowrap text-warning tabular-nums"
        aria-label="Sisa waktu pembayaran"
      >
        {now === null ? "-- : -- : --" : remaining(target, now)}
      </span>
    </div>
  );
}
