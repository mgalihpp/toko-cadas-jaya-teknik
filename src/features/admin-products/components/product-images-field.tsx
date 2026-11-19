"use client";

import { ArrowLeftIcon, ArrowRightIcon, ImagePlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { MAX_IMAGES, type ProductImage } from "../schemas";

type Props = {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
};

export function ProductImagesField({ images, onChange }: Props) {
  const remaining = MAX_IMAGES - images.length;

  function move(index: number, delta: number) {
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <li
              key={img.url}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border bg-ink-50",
                i === 0 ? "border-brand-500 ring-2 ring-brand-100" : "border-ink-200"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- URL UploadThing belum terdaftar di images.remotePatterns */}
              <img src={img.url} alt={`Foto produk ${i + 1}`} className="size-full object-cover" />
              {i === 0 ? (
                <span className="absolute top-2 left-2 rounded-md bg-brand-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  Sampul
                </span>
              ) : null}
              <Button
                type="button"
                size="icon-xs"
                variant="secondary"
                className="absolute top-2 right-2 bg-white/90 shadow-sm"
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                aria-label={`Hapus foto ${i + 1}`}
              >
                <XIcon />
              </Button>
              <div className="absolute inset-x-2 bottom-2 flex justify-between">
                <Button
                  type="button"
                  size="icon-xs"
                  variant="secondary"
                  className="bg-white/90 shadow-sm disabled:invisible"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  aria-label="Geser ke kiri"
                >
                  <ArrowLeftIcon />
                </Button>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="secondary"
                  className="bg-white/90 shadow-sm disabled:invisible"
                  disabled={i === images.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="Geser ke kanan"
                >
                  <ArrowRightIcon />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {remaining > 0 ? (
        <UploadDropzone
          endpoint="productImage"
          config={{ mode: "auto" }}
          onBeforeUploadBegin={(files) => {
            if (files.length > remaining) {
              toast.error(`Maksimal ${MAX_IMAGES} foto. Hanya ${remaining} foto pertama yang diunggah.`);
            }
            return files.slice(0, remaining);
          }}
          onClientUploadComplete={(res) => {
            const added = res.map((r) => ({ url: r.serverData.url, fileKey: r.serverData.key }));
            onChange([...images, ...added].slice(0, MAX_IMAGES));
            toast.success(`${added.length} foto diunggah`);
          }}
          onUploadError={(error) => {
            toast.error(error.message || "Gagal mengunggah foto");
          }}
          appearance={{
            container: ({ isDragActive }) =>
              cn(
                "m-0 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
                isDragActive ? "border-brand-500 bg-brand-50" : "border-ink-300 bg-ink-50 hover:bg-ink-100"
              ),
            uploadIcon: "size-8 text-ink-500",
            label: "text-sm font-medium text-ink-700",
            allowedContent: "text-xs text-ink-500",
            button: ({ isUploading }) =>
              cn(
                "h-8 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground",
                isUploading && "bg-brand-500"
              ),
          }}
          content={{
            uploadIcon: <ImagePlusIcon className="size-8 text-ink-500" />,
            label: "Tarik foto atau klik untuk memilih",
            allowedContent: `JPG, PNG, WebP, maks 2 MB. Sisa ${remaining} foto`,
            button: ({ isUploading, uploadProgress }) =>
              isUploading ? `Mengunggah ${uploadProgress}%` : "Pilih foto",
          }}
        />
      ) : (
        <p className="text-sm text-ink-500">Batas {MAX_IMAGES} foto tercapai. Hapus foto untuk menambah yang baru.</p>
      )}
    </div>
  );
}
