import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CONTAINER } from "./container";

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-3" aria-hidden>
      <Skeleton className="aspect-[4/3] w-full rounded-lg bg-ink-100" />
      <Skeleton className="h-3 w-32 rounded bg-ink-100" />
      <Skeleton className="h-[2.625rem] w-full rounded bg-ink-200" />
      <Skeleton className="h-5 w-28 rounded bg-ink-100" />
      <Skeleton className="h-10 w-full rounded-lg bg-ink-100" />
    </div>
  );
}

export function ProductGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3", className)}>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className={cn(CONTAINER, "pt-8 pb-24")} role="status">
      <span className="sr-only">Memuat katalog</span>
      <Skeleton className="h-3 w-32 bg-ink-100" />
      <Skeleton className="mt-4 h-10 w-64 bg-ink-200" />
      <div className="mt-8 flex gap-12">
        <div className="hidden w-[260px] shrink-0 flex-col gap-6 lg:flex">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-3 border-b border-ink-200 pb-6">
              <Skeleton className="h-4 w-24 bg-ink-200" />
              <Skeleton className="h-3.5 w-40 bg-ink-100" />
              <Skeleton className="h-3.5 w-32 bg-ink-100" />
              <Skeleton className="h-3.5 w-36 bg-ink-100" />
            </div>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex justify-between gap-3">
            <Skeleton className="h-10 w-full max-w-md bg-ink-100" />
            <Skeleton className="h-10 w-36 bg-ink-100" />
          </div>
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className={cn(CONTAINER, "pt-7 pb-24")} role="status">
      <span className="sr-only">Memuat produk</span>
      <Skeleton className="h-3 w-72 max-w-full bg-ink-100" />
      <div className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
        <div className="flex flex-col-reverse gap-4 lg:flex-row">
          <div className="flex gap-3 lg:flex-col">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="size-16 rounded-[10px] bg-ink-100 lg:size-[84px]" />
            ))}
          </div>
          <Skeleton className="aspect-square w-full rounded-[20px] bg-ink-100 lg:aspect-auto lg:h-[580px]" />
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-6 w-40 bg-ink-100" />
          <Skeleton className="h-10 w-full bg-ink-200" />
          <Skeleton className="h-9 w-48 bg-ink-200" />
          <Skeleton className="h-20 w-full bg-ink-100" />
          <Skeleton className="h-12 w-full bg-ink-100" />
          <Skeleton className="h-40 w-full bg-ink-100" />
        </div>
      </div>
    </div>
  );
}
