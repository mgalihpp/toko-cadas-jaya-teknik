"use client";

import { useEffect, useRef } from "react";

type Handlers = { onLeft?: () => void; onRight?: () => void; threshold?: number };

export function useSwipe<T extends HTMLElement>(handlers: Handlers) {
  const ref = useRef<T>(null);
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let sx = 0;
    let sy = 0;
    const start = (e: TouchEvent) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    };
    const end = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      const threshold = latest.current.threshold ?? 60;
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) latest.current.onLeft?.();
      else latest.current.onRight?.();
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchend", end, { passive: true });
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchend", end);
    };
  }, []);

  return ref;
}
