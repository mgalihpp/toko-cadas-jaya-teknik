"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";

let lastUserId: string | undefined | null = undefined;

export function useIsCustomer() {
  const { data: session, isPending } = useSession();
  const isCustomer = Boolean(session) && session?.user.role !== "admin";
  return { session, isPending, isCustomer };
}

export function useCart() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { session, isCustomer } = useIsCustomer();
  const userId = session?.user.id;
  const queryKey = trpc.cart.list.queryKey();

  useEffect(() => {
    if (lastUserId !== undefined && lastUserId !== userId) {
      queryClient.removeQueries({ queryKey });
    }
    lastUserId = userId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return useQuery(trpc.cart.list.queryOptions(undefined, { enabled: isCustomer }));
}

export function useCartCount(): number {
  const { isCustomer } = useIsCustomer();
  const { data } = useCart();
  if (!isCustomer) return 0;
  return data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}

export function useCartMutations() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const options = {
    onError: (error: { message: string }) => toast.error(error.message),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: trpc.cart.list.queryKey() }),
  };
  const setQuantity = useMutation(trpc.cart.setQuantity.mutationOptions(options));
  const remove = useMutation(trpc.cart.remove.mutationOptions(options));
  return { setQuantity, remove };
}
