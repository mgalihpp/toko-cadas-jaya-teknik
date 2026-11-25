"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircleIcon,
  CameraIcon,
  CopyIcon,
  ImageIcon,
  InfoIcon,
  LandmarkIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { MButton } from "@/components/mobile/m-button";
import { BottomSheet, SheetClose, SheetRoot } from "@/components/mobile/sheet";
import { StickyBar } from "@/components/mobile/sticky-bar";
import { TopBar } from "@/components/mobile/top-bar";
import { OrderStatusBadge } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/format";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { PROOF_ACCEPT, PROOF_MAX_BYTES } from "../constants";
import { useOrder, useSubmitProof } from "../hooks/use-orders";
import { PaymentCountdown } from "./payment-countdown";

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
}

type Rejected = { name: string; size: number; message: string; title: string; preview: string | null };

function validate(file: File): { title: string; message: string } | null {
  if (!PROOF_ACCEPT.includes(file.type)) {
    return { title: "Format tidak didukung", message: "Gunakan foto JPG, PNG, atau WebP." };
  }
  if (file.size > PROOF_MAX_BYTES) {
    return {
      title: "Berkas terlalu besar",
      message: `Ukuran berkas ${formatSize(file.size)}. Kompres atau pilih foto lain di bawah 2 MB.`,
    };
  }
  return null;
}

function SheetHeader({ title }: { title: string }) {
  return (
    <div className="flex h-12 items-center gap-1 pr-2 pl-4">
      <p className="flex-1 text-[17px] font-bold text-ink-900">{title}</p>
      <SheetClose aria-label="Tutup" className="flex size-10 items-center justify-center rounded-full text-ink-500">
        <XIcon className="size-6" strokeWidth={1.8} />
      </SheetClose>
    </div>
  );
}

export function PaymentPage({ code }: { code: string }) {
  const router = useRouter();
  const trpc = useTRPC();
  const { data: order, isPending, isError } = useOrder(code);
  const { data: settings } = useQuery(trpc.settings.get.queryOptions());
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [rejected, setRejected] = useState<Rejected | null>(null);
  const submitProof = useSubmitProof();
  const { startUpload, isUploading } = useUploadThing("paymentProof", {
    onUploadProgress: setProgress,
  });
  const busy = isUploading || submitProof.isPending;

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setProgress(0);
  }

  function pick(candidate: File | undefined) {
    if (!candidate || busy) return;
    const problem = validate(candidate);
    setPickerOpen(false);
    if (problem) {
      reset();
      setRejected({
        name: candidate.name,
        size: candidate.size,
        ...problem,
        preview: candidate.type.startsWith("image/") ? URL.createObjectURL(candidate) : null,
      });
      setUploadOpen(true);
      return;
    }
    reset();
    setRejected(null);
    setFile(candidate);
    setPreview(URL.createObjectURL(candidate));
  }

  async function send() {
    if (!file) return;
    setUploadOpen(true);
    setRejected(null);
    try {
      const res = await startUpload([file]);
      const uploaded = res?.[0]?.serverData;
      if (!uploaded) throw new Error("Unggah gagal");
      await submitProof.mutateAsync({ code, proofUrl: uploaded.url, proofKey: uploaded.key });
      toast.success("Bukti transfer terkirim. Owner akan memeriksanya segera.");
      setUploadOpen(false);
      router.replace(`/pesanan/${code}`);
    } catch (err) {
      setProgress(0);
      setRejected({
        name: file.name,
        size: file.size,
        title: "Unggah gagal",
        message: err instanceof Error && err.message ? err.message : "Bukti transfer gagal dikirim. Coba lagi.",
        preview,
      });
    }
  }

  const header = (
    <TopBar
      title="Pembayaran"
      backHref={`/pesanan/${code}`}
      cart={false}
      right={<span className="px-3 text-xs font-medium text-ink-500">{code}</span>}
    />
  );

  if (isPending) {
    return (
      <div className="flex flex-1 flex-col">
        {header}
        <div role="status" className="flex flex-col gap-1.5">
          <Skeleton className="h-36 rounded-none" />
          <Skeleton className="h-36 rounded-none" />
        </div>
      </div>
    );
  }
  if (isError || !order) {
    return (
      <div className="flex flex-1 flex-col">
        {header}
        <p className="p-6 text-center text-sm text-ink-500">Pesanan tidak ditemukan.</p>
      </div>
    );
  }

  const awaiting = order.paymentMethod === "transfer" && order.status === "menunggu_pembayaran";
  if (!awaiting) {
    return (
      <div className="flex flex-1 flex-col">
        {header}
        <div className="flex flex-col items-center gap-3 bg-white px-4 py-8">
          <OrderStatusBadge status={order.status} />
          <p className="text-center text-sm text-ink-500">
            Pesanan ini tidak sedang menunggu pembayaran transfer.
          </p>
          <MButton variant="outline" onClick={() => router.replace(`/pesanan/${code}`)}>
            Lihat detail pesanan
          </MButton>
        </div>
      </div>
    );
  }

  const banks = [...(settings?.bankAccounts ?? [])].sort((a, b) => Number(b.primary) - Number(a.primary));

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Nomor rekening disalin");
    } catch {
      toast.error("Gagal menyalin nomor rekening");
    }
  }

  return (
    <div className="flex flex-1 flex-col pb-[76px]">
      {header}
      <section className="flex flex-col items-center gap-2 bg-white px-4 py-[18px]">
        <p className="text-[13px] text-ink-500">Total yang harus ditransfer</p>
        <p className="text-[30px] leading-[1.35] font-bold text-brand-700">{formatRupiah(order.total)}</p>
        {order.expiresAt ? <PaymentCountdown expiresAt={order.expiresAt} onExpire={() => router.refresh()} /> : null}
        <p className="text-xs text-ink-500">Stok pesananmu kami tahan sampai waktunya habis.</p>
      </section>
      <div className="h-1.5" />

      <section className="flex flex-col gap-2.5 bg-white p-3">
        <h2 className="text-[15px] font-bold text-ink-900">Transfer ke rekening</h2>
        {banks.length === 0 ? (
          <p className="text-sm text-ink-500">Rekening tujuan belum diatur. Hubungi toko.</p>
        ) : (
          banks.map((bank) => (
            <div key={`${bank.bank}-${bank.number}`} className="flex items-center gap-2.5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-brand-100">
                <LandmarkIcon className="size-6 text-brand-600" strokeWidth={2} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-sm font-bold text-ink-900">{bank.bank}</p>
                <p className="text-lg font-bold tracking-[0.5px] text-brand-700">{bank.number}</p>
                <p className="text-[13px] text-ink-500">a.n. {bank.holder}</p>
              </div>
              <button
                type="button"
                onClick={() => copy(bank.number)}
                className="flex items-center gap-1 rounded-lg border-[1.5px] border-brand-600 px-2.5 py-2 text-[13px] font-bold text-brand-700"
              >
                <CopyIcon className="size-4" />
                Salin
              </button>
            </div>
          ))
        )}
        <div className="flex items-center gap-2.5 rounded-[10px] border border-info-border bg-info-soft px-2.5 py-2">
          <InfoIcon className="size-5 shrink-0 text-brand-700" strokeWidth={2} />
          <p className="text-[13px] text-ink-900">Pastikan nominal transfer sama persis dengan total di atas.</p>
        </div>
      </section>
      <div className="h-1.5" />

      <section className="flex flex-col gap-2.5 bg-white p-3">
        <h2 className="text-[15px] font-bold text-ink-900">Bukti transfer</h2>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="relative flex h-[132px] flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border-2 border-dashed border-brand-500 bg-brand-50"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Bukti transfer yang dipilih" className="absolute inset-0 size-full object-contain" />
          ) : (
            <>
              <UploadIcon className="size-[30px] text-brand-600" strokeWidth={1.8} />
              <span className="text-[15px] font-bold text-brand-700">Ketuk untuk unggah bukti</span>
              <span className="text-xs text-ink-500">JPG, PNG, atau WebP · maksimal 2 MB</span>
            </>
          )}
        </button>
      </section>
      <div className="h-1.5" />

      <section className="flex items-center gap-2 bg-white p-3">
        <p className="flex-1 text-sm text-ink-500">Status pesanan</p>
        <OrderStatusBadge status={order.status} />
      </section>

      <StickyBar>
        <MButton
          size="lg"
          block
          disabled={busy}
          onClick={() => (file ? send() : setPickerOpen(true))}
        >
          <UploadIcon className="size-[18px]" />
          {file ? "Kirim bukti transfer" : "Unggah bukti transfer"}
        </MButton>
      </StickyBar>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept={PROOF_ACCEPT.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <SheetRoot open={pickerOpen} onOpenChange={setPickerOpen}>
        <BottomSheet title="Pilih bukti transfer">
          <SheetHeader title="Pilih bukti transfer" />
          <div className="flex flex-col gap-3 px-4 pt-1 pb-6">
            <div className="flex gap-2.5">
              {(
                [
                  ["Kamera", CameraIcon, cameraRef],
                  ["Galeri", ImageIcon, galleryRef],
                ] as const
              ).map(([label, Icon, ref]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => ref.current?.click()}
                  className="flex h-[88px] flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-ink-200"
                >
                  <Icon className="size-7 text-brand-600" strokeWidth={1.8} />
                  <span className="text-sm font-bold text-ink-900">{label}</span>
                </button>
              ))}
            </div>
            <p className="text-[13px] text-ink-500">Format JPG, PNG, atau WebP, maksimal 2 MB.</p>
          </div>
        </BottomSheet>
      </SheetRoot>

      <SheetRoot
        open={uploadOpen}
        onOpenChange={(open) => {
          if (!open && busy) return;
          setUploadOpen(open);
        }}
      >
        <BottomSheet title="Unggah bukti">
          <SheetHeader title={rejected ? "Unggah bukti" : "Mengunggah bukti"} />
          <div className="flex flex-col gap-3 px-4 pt-1 pb-3">
            {rejected ? (
              <>
                <div className="flex gap-2.5 rounded-[10px] border border-error-border bg-error-soft p-3">
                  <AlertCircleIcon className="size-5 shrink-0 text-error" strokeWidth={2} />
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-bold text-error">{rejected.title}</p>
                    <p className="text-[13px] text-ink-900">{rejected.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-error-border bg-white p-2.5">
                  <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                    {rejected.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={rejected.preview} alt="" className="size-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="truncate text-sm font-medium text-ink-900">{rejected.name}</p>
                    <p className="text-xs font-bold text-error">{formatSize(rejected.size)} · Gagal diunggah</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Hapus berkas"
                    onClick={() => {
                      setRejected(null);
                      setUploadOpen(false);
                    }}
                    className="text-ink-500"
                  >
                    <XIcon className="size-5" />
                  </button>
                </div>
              </>
            ) : file ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="size-[84px] shrink-0 overflow-hidden rounded-[10px] bg-ink-100">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt="" className="size-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <p className="truncate text-sm font-medium text-ink-900">{file.name}</p>
                    <p className="text-xs text-ink-500">{formatSize(file.size)}</p>
                    <div className="h-2 overflow-hidden rounded bg-brand-100">
                      <div
                        className="h-full rounded bg-brand-600 transition-[width]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs font-bold text-brand-700">Mengunggah… {Math.round(progress)}%</p>
                  </div>
                </div>
                <div className="flex gap-2.5 rounded-[10px] border border-info-border bg-info-soft p-3">
                  <InfoIcon className="size-5 shrink-0 text-brand-700" strokeWidth={2} />
                  <p className="text-[13px] text-ink-900">
                    Setelah terunggah, Owner akan mengecek buktimu. Status berubah ke Menunggu konfirmasi.
                  </p>
                </div>
              </>
            ) : null}
          </div>
          <div className="flex flex-col gap-2.5 border-t border-ink-200 px-4 pt-2.5 pb-[18px]">
            {rejected ? (
              <MButton
                size="lg"
                block
                onClick={() => {
                  setUploadOpen(false);
                  setRejected(null);
                  setPickerOpen(true);
                }}
              >
                <ImageIcon className="size-[18px]" />
                Pilih foto lain
              </MButton>
            ) : (
              <MButton size="lg" block loading className={cn("bg-brand-700")}>
                Mengunggah…
              </MButton>
            )}
          </div>
        </BottomSheet>
      </SheetRoot>
    </div>
  );
}
