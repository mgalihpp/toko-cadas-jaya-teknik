"use client";

import { CatalogLoadError } from "@/features/catalog";

export default function CatalogError({ retry }: { error: unknown; retry: () => void }) {
  return <CatalogLoadError onRetry={retry} />;
}
