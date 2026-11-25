"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StoreDrawer } from "./store-drawer";

const ROOT_TABS = ["/", "/produk", "/pesanan", "/saya"];
const EDGE = 28;
const FRAME = 430;

export function EdgeGestures() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const isRoot = ROOT_TABS.includes(pathname);

  useEffect(() => {
    let sx: number | null = null;
    let sy = 0;
    const frameLeft = () => Math.max(0, (window.innerWidth - FRAME) / 2);
    const start = (e: TouchEvent) => {
      const x = e.touches[0].clientX;
      const left = frameLeft();
      sx = x >= left && x - left <= EDGE ? x : null;
      sy = e.touches[0].clientY;
    };
    const end = (e: TouchEvent) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (dx < 70 || Math.abs(dy) > dx) return;
      if (isRoot) setOpen(true);
      else router.back();
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchend", end, { passive: true });
    return () => {
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchend", end);
    };
  }, [isRoot, router]);

  return <StoreDrawer open={open} onOpenChange={setOpen} />;
}
