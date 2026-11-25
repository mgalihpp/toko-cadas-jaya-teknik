"use client";

import { useMutation } from "@tanstack/react-query";
import { EyeOffIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MButton } from "@/components/mobile/m-button";
import { BottomSheet, SheetClose, SheetRoot } from "@/components/mobile/sheet";
import { useTRPC } from "@/trpc/client";
import { useInvalidateProducts, useSetProductActive } from "../hooks/use-product-mutations";

type Props = {
  product: { id: string; name: string; isActive: boolean } | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function DeleteProductDialog({ product, onOpenChange, onDeleted }: Props) {
  const trpc = useTRPC();
  const invalidate = useInvalidateProducts();
  const [conflict, setConflict] = useState<string | null>(null);
  const setActive = useSetProductActive();
  const remove = useMutation(
    trpc.admin.products.delete.mutationOptions({
      onSuccess: async () => {
        toast.success("Produk dihapus");
        close();
        onDeleted?.();
        await invalidate();
      },
      onError: (error) => {
        if (error.data?.code === "CONFLICT") setConflict(error.message);
        else toast.error(error.message);
      },
    }),
  );

  function close() {
    setConflict(null);
    remove.reset();
    onOpenChange(false);
  }

  const busy = remove.isPending || setActive.isPending;

  return (
    <SheetRoot open={product !== null} onOpenChange={(open) => !open && close()}>
      <BottomSheet title="Hapus produk">
        <div className="flex h-12 items-center gap-1 pr-2 pl-4">
          <p className="flex-1 text-[17px] font-bold text-ink-900">Hapus produk?</p>
          <SheetClose aria-label="Tutup" className="flex size-10 items-center justify-center rounded-full text-ink-500">
            <XIcon className="size-6" strokeWidth={1.8} />
          </SheetClose>
        </div>
        <div className="flex flex-col gap-3 px-4 py-1">
          <div
            className={
              conflict
                ? "flex gap-2.5 rounded-[10px] border border-warning-border bg-warning-soft p-3"
                : "flex gap-2.5 rounded-[10px] border border-error-border bg-error-soft p-3"
            }
          >
            <TriangleAlertIcon className={conflict ? "size-5 shrink-0 text-warning" : "size-5 shrink-0 text-error"} strokeWidth={2} />
            <div className="flex flex-col gap-0.5">
              <p className={conflict ? "text-sm font-bold text-warning" : "text-sm font-bold text-error"}>
                {conflict ? "Tidak bisa dihapus" : "Hapus permanen"}
              </p>
              <p className="text-[13px] text-ink-900">
                {conflict
                  ? "Produk ini sudah pernah dipesan, jadi tidak bisa dihapus permanen agar riwayat dan laporan tetap utuh. Kamu bisa menonaktifkannya."
                  : `${product?.name ?? "Produk"} akan dihapus permanen beserta fotonya. Tindakan ini tidak bisa dibatalkan.`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2.5 border-t border-ink-200 px-4 pt-2.5 pb-[18px]">
          <MButton variant="outline" size="lg" className="w-[110px]" disabled={busy} onClick={close}>
            Batal
          </MButton>
          {conflict ? (
            product?.isActive ? (
              <MButton
                size="lg"
                block
                className="bg-brand-700"
                loading={setActive.isPending}
                onClick={() => setActive.mutate({ id: product.id, isActive: false }, { onSuccess: close })}
              >
                <EyeOffIcon className="size-[18px]" />
                Nonaktifkan produk
              </MButton>
            ) : null
          ) : (
            <MButton
              variant="danger"
              size="lg"
              block
              loading={remove.isPending}
              onClick={() => product && remove.mutate({ id: product.id })}
            >
              Hapus produk
            </MButton>
          )}
        </div>
      </BottomSheet>
    </SheetRoot>
  );
}
