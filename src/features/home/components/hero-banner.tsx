"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductImage } from "@/features/catalog";
import { cn } from "@/lib/utils";

export function HeroBanner({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);
  const count = Math.min(images.length, 3);

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 4000);
    return () => clearInterval(timer);
  }, [count]);

  return (
    <div className="m-3 flex h-[132px] items-center gap-2 overflow-hidden rounded-[14px] bg-gradient-to-br from-brand-700 to-brand-500 px-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-xl leading-[1.35] font-bold text-white">Pesta alat teknik</p>
        <p className="text-[13px] leading-[1.35] text-brand-100">
          Bor, gerinda, kompresor. Baru dan bekas, harga jelas.
        </p>
        <Link
          href="/produk"
          className="mt-1 w-fit rounded-lg bg-white px-3 py-[7px] text-xs font-bold text-brand-700"
        >
          Lihat katalog
        </Link>
      </div>
      <div className="relative size-[110px] shrink-0 overflow-hidden rounded-[14px] bg-gradient-to-br from-[#DCEBF8] to-brand-200">
        {count > 0 ? (
          <ProductImage
            src={images[index]}
            alt=""
            loading="eager"
            className="absolute inset-0 size-full object-cover"
          />
        ) : null}
        {count > 1 ? (
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-[5px]">
            {Array.from({ length: count }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-[5px] rounded-[3px] bg-white transition-all",
                  i === index ? "w-[18px]" : "w-[5px] opacity-55",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
