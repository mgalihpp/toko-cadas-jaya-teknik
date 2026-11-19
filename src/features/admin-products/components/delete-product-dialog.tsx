"use client";

import { useMutation } from "@tanstack/react-query";
import { EyeOffIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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
    })
  );

  function close() {
    setConflict(null);
    remove.reset();
    onOpenChange(false);
  }

  const busy = remove.isPending || setActive.isPending;

  return (
    <AlertDialog open={product !== null} onOpenChange={(open) => !open && close()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-error-soft text-error">
            {conflict ? <EyeOffIcon /> : <Trash2Icon />}
          </AlertDialogMedia>
          <AlertDialogTitle>
            {conflict ? "Produk tidak bisa dihapus" : "Hapus produk ini?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {conflict ? (
              conflict
            ) : (
              <>
                <span className="font-medium text-ink-900">{product?.name}</span> akan dihapus
                permanen beserta fotonya. Tindakan ini tidak bisa dibatalkan.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
          {conflict ? (
            product?.isActive ? (
              <Button
                disabled={busy}
                onClick={() =>
                  product &&
                  setActive.mutate(
                    { id: product.id, isActive: false },
                    { onSuccess: close }
                  )
                }
              >
                {setActive.isPending ? <Spinner /> : <EyeOffIcon />}
                Nonaktifkan
              </Button>
            ) : null
          ) : (
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => product && remove.mutate({ id: product.id })}
            >
              {remove.isPending ? <Spinner /> : <Trash2Icon />}
              Hapus
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
