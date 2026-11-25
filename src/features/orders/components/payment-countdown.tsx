"use client";

import { ClockIcon } from "lucide-react";
import { useEffect, useState } from "react";

function remaining(target: number, now: number) {
  const total = Math.max(0, Math.floor((target - now) / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
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
    <div className="flex items-center gap-1.5 rounded-[18px] bg-warning-soft px-3.5 py-[7px]">
      <ClockIcon className="size-[18px] text-warning" strokeWidth={2} />
      <p className="text-sm font-bold text-warning" aria-label="Sisa waktu pembayaran">
        Bayar dalam {now === null ? "--:--:--" : remaining(target, now)}
      </p>
    </div>
  );
}
