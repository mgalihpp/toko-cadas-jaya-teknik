"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

export function useInvalidateProducts() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries(trpc.admin.products.pathFilter()),
      queryClient.invalidateQueries(trpc.admin.stock.pathFilter()),
      queryClient.invalidateQueries(trpc.admin.categories.pathFilter()),
      queryClient.invalidateQueries(trpc.admin.finance.dashboard.pathFilter()),
      queryClient.invalidateQueries(trpc.catalog.pathFilter()),
    ]);
}

export function useSetProductActive() {
  const trpc = useTRPC();
  const invalidate = useInvalidateProducts();
  return useMutation(
    trpc.admin.products.setActive.mutationOptions({
      onSuccess: (_, vars) => {
        toast.success(vars.isActive ? "Produk ditampilkan di katalog" : "Produk disembunyikan dari katalog");
        return invalidate();
      },
      onError: (error) => toast.error(error.message),
    })
  );
}
