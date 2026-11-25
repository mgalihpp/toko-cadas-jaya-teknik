"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function SwipeRow({
  actions,
  actionWidth,
  children,
  className,
}: {
  actions: React.ReactNode;
  actionWidth: number;
  children: React.ReactNode;
  className?: string;
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; base: number; locked: boolean | null } | null>(null);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className="absolute inset-y-0 right-0 flex"
        style={{ width: actionWidth }}
        aria-hidden={offset === 0}
      >
        {actions}
      </div>
      <div
        className="relative bg-white"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform 0.25s ease-out",
        }}
        onTouchStart={(e) => {
          start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, base: offset, locked: null };
          setDragging(true);
        }}
        onTouchMove={(e) => {
          const s = start.current;
          if (!s) return;
          const dx = e.touches[0].clientX - s.x;
          const dy = e.touches[0].clientY - s.y;
          if (s.locked === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) s.locked = Math.abs(dx) > Math.abs(dy);
          if (!s.locked) return;
          setOffset(Math.max(-actionWidth, Math.min(0, s.base + dx)));
        }}
        onTouchEnd={() => {
          start.current = null;
          setDragging(false);
          setOffset((o) => (o < -actionWidth / 2 ? -actionWidth : 0));
        }}
      >
        {children}
      </div>
    </div>
  );
}
