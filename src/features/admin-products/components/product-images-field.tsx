"use client";

import { CameraIcon, ImageIcon, Loader2Icon, XIcon } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";
import { MAX_IMAGES, type ProductImage } from "../schemas";

type Props = {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
};

export function ProductImagesField({ images, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const remaining = MAX_IMAGES - images.length;
  const { startUpload, isUploading } = useUploadThing("productImage", {
    onClientUploadComplete: (res) => {
      const added = res.map((r) => ({ url: r.serverData.url, fileKey: r.serverData.key }));
      onChange([...images, ...added].slice(0, MAX_IMAGES));
      toast.success(`${added.length} foto diunggah`);
    },
    onUploadError: (error) => {
      toast.error(error.message || "Gagal mengunggah foto");
    },
  });

  async function pick(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    if (list.length > remaining) {
      toast.error(`Maksimal ${MAX_IMAGES} foto. Hanya ${remaining} foto pertama yang diunggah.`);
    }
    await startUpload(list.slice(0, remaining));
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2.5">
        {remaining > 0 ? (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => input.current?.click()}
            className="flex size-[92px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand-500 bg-brand-50 text-xs font-bold text-brand-700"
          >
            {isUploading ? <Loader2Icon className="size-6 animate-spin" /> : <CameraIcon className="size-6" strokeWidth={1.8} />}
            {isUploading ? "Mengunggah" : "Tambah"}
          </button>
        ) : null}
        {images.map((img, i) => (
          <div key={img.url} className="relative size-[92px]">
            <div className="size-full overflow-hidden rounded-xl bg-ink-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={`Foto produk ${i + 1}`} className="size-full object-cover" />
            </div>
            <button
              type="button"
              aria-label={`Hapus foto ${i + 1}`}
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              className="absolute -top-1.5 -right-1.5 flex size-[22px] items-center justify-center rounded-full bg-toast text-white"
            >
              <XIcon className="size-3.5" />
            </button>
            {i === 0 ? (
              <span className="absolute bottom-1.5 left-1.5 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                Utama
              </span>
            ) : (
              <button
                type="button"
                aria-label={`Jadikan foto ${i + 1} utama`}
                onClick={() => {
                  const next = [...images];
                  const [item] = next.splice(i, 1);
                  next.unshift(item);
                  onChange(next);
                }}
                className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded bg-toast/80 px-1.5 py-0.5 text-[10px] font-bold text-white"
              >
                <ImageIcon className="size-2.5" />
                Utama
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-500">JPG, PNG, atau WebP · maksimal 2 MB per foto</p>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void pick(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
