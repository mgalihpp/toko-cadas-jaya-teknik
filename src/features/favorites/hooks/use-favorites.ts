"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useIsCustomer } from "@/features/cart";
import { useTRPC } from "@/trpc/client";

export function useFavoriteIds() {
  const trpc = useTRPC();
  const { isCustomer } = useIsCustomer();
  const query = useQuery(trpc.favorites.ids.queryOptions(undefined, { enabled: isCustomer }));
  return new Set(isCustomer ? (query.data ?? []) : []);
}

export function useToggleFavorite() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isCustomer, isPending } = useIsCustomer();
  const mutation = useMutation(
    trpc.favorites.toggle.mutationOptions({
      onSuccess: (res) =>
        toast.success(res.favorited ? "Ditambahkan ke favorit" : "Dihapus dari favorit"),
      onError: (error) => toast.error(error.message),
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: trpc.favorites.ids.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.favorites.list.queryKey() });
      },
    })
  );
  return (productId: string) => {
    if (isPending) return;
    if (!isCustomer) {
      router.push("/masuk");
      return;
    }
    mutation.mutate({ productId });
  };
}
