"use client";

import { ArrowLeftIcon, ArrowRightIcon, ImagePlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { UploadDropzone } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { MAX_IMAGES, type ProductImage } from "../schemas";

type Props = {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
};

const overlayButton =
  "flex size-6 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow-sm outline-none hover:bg-white focus-visible:ring-3 focus-visible:ring-ring/50";

export function ProductImagesField({ images, onChange }: Props) {
  const remaining = MAX_IMAGES - images.length;
  const empty = images.length === 0;

  function move(index: number, delta: number) {
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-3">
        {images.map((img, i) => (
          <li key={img.url} className="group relative h-[132px] overflow-hidden rounded-lg bg-ink-100">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL UploadThing belum terdaftar di images.remotePatterns */}
            <img src={img.url} alt={`Foto produk ${i + 1}`} className="size-full object-cover" />
            {i === 0 ? (
              <span className="absolute top-2 left-2 rounded-full bg-ink-900 px-2 py-[3px] text-[11px]/[13px] font-semibold text-white">
                Sampul
              </span>
            ) : null}
            <button
              type="button"
              className={cn(overlayButton, "absolute top-2 right-2")}
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              aria-label={`Hapus foto ${i + 1}`}
            >
              <XIcon className="size-[13px]" />
            </button>
            <div className="absolute inset-x-2 bottom-2 flex justify-between opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
              <button
                type="button"
                className={cn(overlayButton, "disabled:invisible")}
                disabled={i === 0}
                onClick={() => move(i, -1)}
                aria-label="Geser ke kiri"
              >
                <ArrowLeftIcon className="size-[13px]" />
              </button>
              <button
                type="button"
                className={cn(overlayButton, "disabled:invisible")}
                disabled={i === images.length - 1}
                onClick={() => move(i, 1)}
                aria-label="Geser ke kanan"
              >
                <ArrowRightIcon className="size-[13px]" />
              </button>
            </div>
          </li>
        ))}
        {remaining > 0 ? (
          <li className={cn(empty && "col-span-full")}>
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
                    "m-0! flex h-[132px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg! border-[1.5px]! border-solid! p-0! text-center transition-colors",
                    isDragActive ? "border-brand-500! bg-brand-50" : "border-ink-300! bg-ink-50 hover:bg-ink-100"
                  ),
                uploadIcon: "size-[22px] text-ink-600",
                label: "m-0! w-auto! px-2 text-[13px]/4! font-medium! text-ink-600! hover:text-ink-600!",
                allowedContent: "hidden",
                button: "hidden",
              }}
              content={{
                uploadIcon: <ImagePlusIcon className="size-[22px] text-ink-600" />,
                label: ({ isUploading, uploadProgress }) =>
                  isUploading
                    ? `Mengunggah ${uploadProgress}%`
                    : empty
                      ? "Tarik foto atau klik untuk memilih"
                      : "Tambah",
              }}
            />
          </li>
        ) : null}
      </ul>
      {remaining > 0 ? null : (
        <p className="text-[13px]/4 text-ink-500">
          Batas {MAX_IMAGES} foto tercapai. Hapus foto untuk menambah yang baru.
        </p>
      )}
    </div>
  );
}
