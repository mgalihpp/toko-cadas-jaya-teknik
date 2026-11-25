import { Suspense } from "react";
import { BottomNav } from "@/components/mobile/bottom-nav";
import { EdgeGestures } from "@/components/mobile/edge-gestures";
import { PullToRefresh } from "@/components/mobile/pull-to-refresh";

export function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="flex flex-1 flex-col">{children}</main>
      <Suspense fallback={null}>
        <BottomNav />
        <EdgeGestures />
      </Suspense>
      <PullToRefresh />
    </>
  );
}
