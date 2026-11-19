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
  const current = images[Math.min(index, Math.max(total - 1, 0))];
  const go = (delta: number) => setIndex((i) => (i + delta + total) % total);

  const note =
    condition === "bekas"
      ? `Foto unit asli, ${index + 1} dari ${total}`
      : `Foto ${index + 1} dari ${total}`;

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row lg:gap-4">
      {total > 1 ? (
        <div
          className="flex gap-3 overflow-x-auto pb-1 lg:max-h-[580px] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pb-0"
          role="tablist"
          aria-label="Foto produk"
        >
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Foto ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "size-16 shrink-0 overflow-hidden rounded-[10px] border-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:size-[84px]",
                i === index ? "border-ink-900" : "border-ink-200 hover:border-ink-300"
              )}
            >
              <ProductImage src={image.url} alt="" className="size-full" />
            </button>
          ))}
        </div>
      ) : null}
      <div className="relative min-w-0 flex-1 overflow-hidden rounded-[20px] bg-ink-100">
        <ProductImage
          src={current?.url}
          alt={total > 0 ? `${name}, foto ${index + 1}` : name}
          loading="eager"
          className="aspect-square w-full lg:aspect-auto lg:h-[580px]"
        />
        {total > 0 ? (
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-ink-900/80 px-2.5 py-1.5 text-xs font-medium text-white">
            <CameraIcon className="size-3.5" />
            {note}
          </span>
        ) : null}
        {total > 1 ? (
          <div className="absolute right-4 bottom-4 flex gap-2 lg:hidden">
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
    </div>
  );
}
