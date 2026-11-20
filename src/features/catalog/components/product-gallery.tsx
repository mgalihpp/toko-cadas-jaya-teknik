"use client";

import { CameraIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Condition } from "../types";
import { ProductImage } from "./product-image";

type GalleryImage = { id: string; url: string };

export function ProductGallery({
  images,
  name,
  condition,
}: {
  images: GalleryImage[];
  name: string;
  condition: Condition;
}) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const used = condition === "bekas";
  const current = images[Math.min(index, Math.max(total - 1, 0))];
  const go = (delta: number) => setIndex((i) => (i + delta + total) % total);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="relative overflow-hidden rounded-xl bg-ink-100">
        <ProductImage
          src={current?.url}
          alt={total > 0 ? `${name}, foto ${index + 1}` : name}
          loading="eager"
          className={cn(
            "aspect-[4/3] w-full object-contain lg:aspect-auto",
            used ? "lg:h-[400px]" : "lg:h-[480px]"
          )}
        />
        {total > 1 ? (
          <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between lg:hidden">
            <button
              type="button"
              aria-label="Foto sebelumnya"
              onClick={() => go(-1)}
              className="flex size-9 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow-sm"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Foto berikutnya"
              onClick={() => go(1)}
              className="flex size-9 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow-sm"
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        ) : null}
      </div>

      {total > 1 ? (
        <>
          <div className="flex items-center justify-center gap-1.5 lg:hidden" aria-hidden>
            {images.map((image, i) => (
              <span
                key={image.id}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-[18px] bg-brand-600" : "w-1.5 bg-ink-300"
                )}
              />
            ))}
          </div>
          <div
            className={cn("hidden gap-2.5 lg:grid", used ? "grid-cols-3" : "grid-cols-5")}
            role="tablist"
            aria-label="Foto produk"
          >
            {images.slice(0, used ? 6 : 5).map((image, i) => (
              <button
                key={image.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Foto ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "overflow-hidden rounded-lg border outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  used ? "h-[150px]" : "h-[92px]",
                  i === index ? "border-2 border-brand-600" : "border-ink-200 hover:border-ink-300"
                )}
              >
                <ProductImage src={image.url} alt="" className="size-full" />
              </button>
            ))}
          </div>
        </>
      ) : null}

      {used && total > 0 ? (
        <p className="flex items-center gap-1.5 text-xs text-ink-500">
          <CameraIcon className="size-3.5" />
          Foto kondisi aktual barang yang Anda beli, bukan foto katalog.
        </p>
      ) : null}
    </div>
  );
}
