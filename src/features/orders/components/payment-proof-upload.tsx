"use client";

import { AlertCircle, ImageIcon, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { PROOF_ACCEPT, PROOF_MAX_BYTES } from "../constants";
import { useSubmitProof } from "../hooks/use-orders";

function formatSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
}

function validate(file: File): string[] {
  const errors: string[] = [];
  if (!PROOF_ACCEPT.includes(file.type)) errors.push("Format harus JPG, PNG, atau WebP");
  if (file.size > PROOF_MAX_BYTES) {
    errors.push(`Ukuran ${formatSize(file.size)} melebihi batas 2 MB`);
  }
  return errors;
}

export function PaymentProofUpload({ code }: { code: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [rejected, setRejected] = useState<{ name: string; errors: string[] } | null>(
    null
  );
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const submitProof = useSubmitProof();

  const { startUpload, isUploading } = useUploadThing("paymentProof", {
    onUploadProgress: setProgress,
  });

  const busy = isUploading || submitProof.isPending;

  function pick(candidate: File | undefined) {
    if (!candidate || busy) return;
    const errors = validate(candidate);
    if (errors.length > 0) {
      setFile(null);
      setRejected({ name: candidate.name, errors });
      return;
    }
    setRejected(null);
    setProgress(0);
    setFile(candidate);
  }

  async function send() {
    if (!file) return;
    try {
      const res = await startUpload([file]);
      const uploaded = res?.[0]?.serverData;
      if (!uploaded) throw new Error("Upload gagal");
      await submitProof.mutateAsync({
        code,
        proofUrl: uploaded.url,
        proofKey: uploaded.key,
      });
      toast.success("Bukti transfer terkirim. Owner akan memeriksanya segera.");
      setFile(null);
    } catch (err) {
      setProgress(0);
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "Bukti transfer gagal dikirim. Coba lagi."
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="button"
        tabIndex={0}
        aria-disabled={busy}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed bg-white px-6 py-10 text-center transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          dragging ? "border-brand-500 bg-brand-50" : "border-ink-300 hover:border-brand-200",
          busy && "pointer-events-none opacity-60"
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Upload className="size-5" />
        </span>
        <p className="text-[15px] text-ink-600">
          Tarik gambar ke sini atau{" "}
          <span className="font-semibold text-brand-700">pilih file</span>
        </p>
        <p className="text-[13px] text-ink-500">JPG, PNG, atau WebP, maksimal 2 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={PROOF_ACCEPT.join(",")}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      {rejected && (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-error-border bg-error-soft px-4 py-3"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-error" />
          <div className="min-w-0 text-error">
            <p className="truncate text-sm font-semibold">
              {rejected.name} tidak bisa diunggah
            </p>
            {rejected.errors.map((msg) => (
              <p key={msg} className="text-[13px]">
                {msg}
              </p>
            ))}
          </div>
        </div>
      )}

      {file && (
        <div className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-600">
            <ImageIcon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900">{file.name}</p>
            <p className="text-xs text-ink-500">
              {isUploading
                ? `${formatSize((file.size * progress) / 100)} dari ${formatSize(file.size)}`
                : formatSize(file.size)}
            </p>
            {isUploading && (
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full bg-brand-600 transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
          {!busy && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Hapus file"
              onClick={() => setFile(null)}
            >
              <X />
            </Button>
          )}
        </div>
      )}

      <Button
        type="button"
        size="lg"
        className="h-12 w-full text-sm font-semibold"
        disabled={!file || busy}
        onClick={send}
      >
        {busy ? (
          <>
            <Spinner /> Mengirim bukti...
          </>
        ) : (
          <>
            <Upload /> Kirim Bukti Transfer
          </>
        )}
      </Button>
    </div>
  );
}
