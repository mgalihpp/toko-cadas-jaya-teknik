"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/mobile/bottom-nav";
import { EdgeGestures } from "@/components/mobile/edge-gestures";
import { PullToRefresh } from "@/components/mobile/pull-to-refresh";
import { cn } from "@/lib/utils";

const TAB_PATHS = ["/", "/produk", "/pesanan", "/saya", "/notifikasi"];

export function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const tabs = TAB_PATHS.includes(pathname);
  return (
    <>
      <main className={cn("flex flex-1 flex-col", tabs && "pb-[68px]")}>{children}</main>
      {tabs ? <BottomNav /> : null}
      <EdgeGestures />
      <PullToRefresh />
    </>
  );
}
