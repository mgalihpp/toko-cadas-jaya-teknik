"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { catalogHref, type CatalogFilters } from "../schemas";

export function useCatalogNavigation(filters: CatalogFilters) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function update(changes: Partial<CatalogFilters>, options?: { keepPage?: boolean }) {
    const next: CatalogFilters = {
      ...filters,
      ...changes,
      page: options?.keepPage ? (changes.page ?? filters.page) : 1,
    };
    startTransition(() => {
      router.push(catalogHref(next), { scroll: false });
    });
  }

  function reset() {
    startTransition(() => {
      router.push("/produk", { scroll: false });
    });
  }

  return { update, reset, isPending };
}
