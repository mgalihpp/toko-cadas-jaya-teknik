"use client";

import { ChevronLeftIcon, HeartIcon, ShareIcon, ShoppingCartIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { CountBadge } from "@/components/mobile/count-badge";
import { useCartCount } from "@/features/cart";
import { useFavoriteIds, useToggleFavorite } from "@/features/favorites";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";

const overlayButton =
  "relative flex size-10 items-center justify-center rounded-full bg-[rgba(15,36,56,.6)] text-white";

export function ProductGallery({
  productId,
  images,
  name,
}: {
  productId: string;
  images: { id: string; url: string }[];
  name: string;
}) {
  const router = useRouter();
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState<string | null>(null);
  const cartCount = useCartCount();
  const favorites = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const favorited = favorites.has(productId);
  const slides = images.length > 0 ? images : [{ id: "empty", url: "" }];

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Tautan produk disalin");
      }
    } catch {
      /* dibatalkan pengguna */
    }
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden bg-ink-100">
      <div
        ref={scroller}
        className="cjt-no-scrollbar flex size-full snap-x snap-mandatory overflow-x-auto"
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {slides.map((image) => (
          <div
            key={image.id}
            className="size-full shrink-0 snap-center overflow-hidden"
            onDoubleClick={() => setZoomed((z) => (z === image.id ? null : image.id))}
          >
            <ProductImage
              src={image.url || null}
              alt={name}
              loading="eager"
              className={cn(
                "size-full object-cover transition-transform duration-200",
                zoomed === image.id && "scale-[2]",
              )}
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-x-3 top-3 flex items-center">
        <button type="button" aria-label="Kembali" onClick={() => router.back()} className={overlayButton}>
          <ChevronLeftIcon className="size-6" strokeWidth={1.8} />
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" aria-label="Bagikan" onClick={share} className={overlayButton}>
            <ShareIcon className="size-5" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label="Favorit"
            aria-pressed={favorited}
            onClick={() => toggleFavorite(productId)}
            className={overlayButton}
          >
            <HeartIcon className={cn("size-5", favorited && "fill-error text-error")} strokeWidth={1.8} />
          </button>
          <Link href="/keranjang" aria-label="Keranjang" className={overlayButton}>
            <ShoppingCartIcon className="size-5" strokeWidth={1.8} />
            <CountBadge count={cartCount} ringClass="border-toast" className="absolute -top-1 -right-1" />
          </Link>
        </div>
      </div>

      {slides.length > 1 ? (
        <>
          <span className="absolute right-3 bottom-3 rounded-xl bg-[rgba(15,36,56,.7)] px-2.5 py-1 text-xs text-white">
            {index + 1}/{slides.length}
          </span>
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-[5px]">
            {slides.map((image, i) => (
              <span
                key={image.id}
                className={cn(
                  "h-[5px] rounded-[3px] transition-all",
                  i === index ? "w-[18px] bg-brand-600" : "w-[5px] bg-[rgba(15,36,56,.35)]",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
