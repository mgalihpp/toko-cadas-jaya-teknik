"use client";

import { useMutation } from "@tanstack/react-query";
import { EyeOffIcon, Trash2Icon } from "lucide-react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useTRPC } from "@/trpc/client";
import { useInvalidateProducts, useSetProductActive } from "../hooks/use-product-mutations";
import { dangerButton, outlineButton, primaryButton } from "../styles";

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
    })
  );

  function close() {
    setConflict(null);
    remove.reset();
    onOpenChange(false);
  }

  const busy = remove.isPending || setActive.isPending;
  const Icon = conflict ? EyeOffIcon : Trash2Icon;

  return (
    <AlertDialog open={product !== null} onOpenChange={(open) => !open && close()}>
      <AlertDialogPortal>
        <AlertDialogOverlay className="bg-ink-900/35 supports-backdrop-filter:backdrop-blur-none" />
        <AlertDialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl bg-white p-6 shadow-[0_16px_40px_#1C191733] outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          <div className="flex gap-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-error-soft text-error">
              <Icon className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <AlertDialogTitle className="font-heading text-lg/[23px] font-semibold text-ink-900">
                {conflict ? "Produk tidak bisa dihapus" : "Hapus produk ini?"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm/[21px] text-ink-600">
                {conflict ? (
                  conflict
                ) : (
                  <>
                    <span className="font-semibold text-ink-900">{product?.name}</span> akan dihapus permanen
                    beserta fotonya. Tindakan ini tidak bisa dibatalkan.
                  </>
                )}
              </AlertDialogDescription>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel disabled={busy} className={outlineButton}>
              Batal
            </AlertDialogCancel>
            {conflict ? (
              product?.isActive ? (
                <Button
                  className={primaryButton}
                  disabled={busy}
                  onClick={() => setActive.mutate({ id: product.id, isActive: false }, { onSuccess: close })}
                >
                  {setActive.isPending ? <Spinner /> : null}
                  Nonaktifkan
                </Button>
              ) : null
            ) : (
              <Button
                className={dangerButton}
                disabled={busy}
                onClick={() => product && remove.mutate({ id: product.id })}
              >
                {remove.isPending ? <Spinner /> : null}
                Hapus
              </Button>
            )}
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
