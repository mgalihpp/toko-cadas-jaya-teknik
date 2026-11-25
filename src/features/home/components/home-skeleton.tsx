import { Skeleton } from "@/components/ui/skeleton";
import { ProductCardSkeleton } from "@/features/catalog";
import { HomeHeader, HomeNotice } from "./home-header";

export function HomeSkeleton() {
  return (
    <div role="status" className="relative flex flex-col">
      <span className="sr-only">Memuat beranda</span>
      <HomeNotice />
      <HomeHeader />
      <div className="m-3">
        <Skeleton className="h-[132px] w-full rounded-[14px]" />
      </div>
      <div className="grid grid-cols-5 gap-y-3 bg-white px-2 py-3.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <Skeleton className="size-[52px] rounded-2xl" />
            <Skeleton className="h-2.5 w-10 rounded-md" />
          </div>
        ))}
      </div>
      <div className="h-2" />
      <div className="flex flex-col gap-2.5 bg-white p-3">
        <Skeleton className="h-[18px] w-[120px] rounded-md" />
        <div className="flex gap-2.5 overflow-hidden">
          {Array.from({ length: 3 }, (_, i) => (
            <ProductCardSkeleton key={i} className="w-[138px] shrink-0" />
          ))}
        </div>
      </div>
      <div className="h-2" />
      <div className="grid grid-cols-2 gap-2.5 p-3">
        <ProductCardSkeleton />
        <ProductCardSkeleton />
      </div>
    </div>
  );
}
