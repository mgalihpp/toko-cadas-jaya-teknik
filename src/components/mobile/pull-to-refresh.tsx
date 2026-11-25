"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, RefreshCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const TRIGGER = 45;

export function PullToRefresh({ onRefresh }: { onRefresh?: () => Promise<unknown> | void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const busyRef = useRef(false);

  useEffect(() => {
    const start = (e: TouchEvent) => {
      if (window.scrollY <= 0 && !busyRef.current) startY.current = e.touches[0].clientY;
    };
    const move = (e: TouchEvent) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0 || window.scrollY > 0) {
        pullRef.current = 0;
        setPull(0);
        return;
      }
      pullRef.current = Math.min(dy * 0.5, 100);
      setPull(pullRef.current);
    };
    const cancel = () => {
      startY.current = null;
      pullRef.current = 0;
      setPull(0);
    };
    const end = async () => {
      const triggered = pullRef.current >= TRIGGER;
      startY.current = null;
      pullRef.current = 0;
      setPull(0);
      if (!triggered || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      try {
        await (onRefresh ? onRefresh() : queryClient.invalidateQueries());
        router.refresh();
        await new Promise((r) => setTimeout(r, 500));
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", end, { passive: true });
    window.addEventListener("touchcancel", cancel, { passive: true });
    return () => {
      window.removeEventListener("touchcancel", cancel);
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
    };
  }, [onRefresh, queryClient, router]);

  if (!busy && pull === 0) return null;
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center"
      style={{ transform: busy ? undefined : `translateY(${pull}px)` }}
    >
      <div className="inline-flex items-center gap-1.5 rounded-full bg-toast px-2.5 py-[5px] text-[11px] font-medium text-white">
        {busy ? (
          <Loader2Icon className="size-3.5 animate-spin text-brand-300" />
        ) : (
          <RefreshCwIcon className="size-3.5 text-brand-300" />
        )}
        {busy ? "Memuat ulang" : "Tarik ke bawah untuk muat ulang"}
      </div>
    </div>
  );
}
