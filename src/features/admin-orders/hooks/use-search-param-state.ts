"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useSearchParamState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParams(updates: Record<string, string | number | null | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return { searchParams, setParams };
}

export function readPage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
