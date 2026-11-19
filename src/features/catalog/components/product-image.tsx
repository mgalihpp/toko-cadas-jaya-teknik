import { ImageOffIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductImage({
  src,
  alt,
  className,
  loading = "lazy",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn("flex items-center justify-center bg-ink-100 text-ink-300", className)}
      >
        <ImageOffIcon className="size-8" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      className={cn("bg-ink-100 object-cover", className)}
    />
  );
}
