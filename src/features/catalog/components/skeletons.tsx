import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("overflow-hidden rounded-[10px] border border-ink-200 bg-white", className)}
      aria-hidden
    >
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-1.5 p-2.5">
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-[70%] rounded-md" />
        <Skeleton className="mt-1 h-[18px] w-[55%] rounded-md" />
        <Skeleton className="h-2.5 w-[35%] rounded-md" />
      </div>
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
    <div className={cn("grid grid-cols-2 gap-2.5 px-3 py-2.5", className)}>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div role="status" className="flex flex-1 flex-col">
      <span className="sr-only">Memuat katalog</span>
      <div className="px-3 pt-3">
        <Skeleton className="h-3.5 w-[130px] rounded-md" />
      </div>
      <ProductGridSkeleton />
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div role="status" className="flex flex-1 flex-col bg-white">
      <span className="sr-only">Memuat produk</span>
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-5 w-24 rounded-md" />
        <Skeleton className="h-6 w-full rounded-md" />
        <Skeleton className="h-8 w-40 rounded-md" />
        <Skeleton className="h-20 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </div>
  );
}
