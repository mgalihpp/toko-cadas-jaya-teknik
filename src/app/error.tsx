"use client";

import { TopBar } from "@/components/mobile/top-bar";
import { ErrorState } from "@/components/shared";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <TopBar title="Cadas Jaya Teknik" backHref="/" cart={false} />
      <ErrorState onRetry={reset} />
    </>
  );
}
