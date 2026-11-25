"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

export function useOrderActions() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  function handlers(success: string) {
    return {
      onSuccess: async () => {
        toast.success(success);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.admin.orders.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.admin.finance.pathKey() }),
        ]);
      },
      onError: (error: { message: string }) => {
        toast.error(error.message || "Aksi gagal, coba lagi");
      },
    };
  }

  return {
    confirmTransfer: useMutation(
      trpc.admin.orders.confirmTransfer.mutationOptions(handlers("Pembayaran diterima. Stok diperbarui."))
    ),
    rejectTransfer: useMutation(
      trpc.admin.orders.rejectTransfer.mutationOptions(
        handlers("Bukti transfer ditolak, pelanggan diminta mengunggah ulang")
      )
    ),
    recordCash: useMutation(
      trpc.admin.orders.recordCash.mutationOptions(handlers("Pembayaran tunai dicatat"))
    ),
    advance: useMutation(
      trpc.admin.orders.advance.mutationOptions(handlers("Status pesanan diperbarui"))
    ),
    cancel: useMutation(
      trpc.admin.orders.cancel.mutationOptions(handlers("Pesanan dibatalkan, stok dilepas"))
    ),
  };
}
