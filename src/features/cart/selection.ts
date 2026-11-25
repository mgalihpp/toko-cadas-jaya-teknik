"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "cjt:cart-unselected";
const listeners = new Set<() => void>();

function read(): string {
  if (typeof window === "undefined") return "[]";
  return window.sessionStorage.getItem(KEY) ?? "[]";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function write(ids: string[]) {
  window.sessionStorage.setItem(KEY, JSON.stringify(ids));
  listeners.forEach((l) => l());
}

export function useCartSelection(allIds: string[]) {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const unselected = new Set<string>(JSON.parse(raw));
  const selected = allIds.filter((id) => !unselected.has(id));

  const toggle = useCallback(
    (id: string) => {
      const next = new Set<string>(JSON.parse(read()));
      if (next.has(id)) next.delete(id);
      else next.add(id);
      write([...next]);
    },
    []
  );
  const setAll = (checked: boolean) => write(checked ? [] : allIds);

  return {
    selected,
    isSelected: (id: string) => !unselected.has(id),
    allSelected: allIds.length > 0 && selected.length === allIds.length,
    toggle,
    setAll,
  };
}
