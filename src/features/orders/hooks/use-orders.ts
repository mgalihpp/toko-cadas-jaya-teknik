"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useOrders() {
  const trpc = useTRPC();
  return useQuery(trpc.orders.list.queryOptions());
}

export function useOrder(code: string) {
  const trpc = useTRPC();
  return useQuery(trpc.orders.byCode.queryOptions({ code }, { retry: false }));
}

export function useStoreSettings() {
  const trpc = useTRPC();
  return useQuery(trpc.settings.get.queryOptions());
}

function useInvalidateOrders() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.orders.list.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.orders.byCode.queryKey() }),
    ]);
}

export function useCancelOrder() {
  const trpc = useTRPC();
  const invalidate = useInvalidateOrders();
  return useMutation(
    trpc.orders.cancel.mutationOptions({ onSuccess: () => invalidate() })
  );
}

export function useSubmitProof() {
  const trpc = useTRPC();
  const invalidate = useInvalidateOrders();
  return useMutation(
    trpc.orders.submitProof.mutationOptions({ onSuccess: () => invalidate() })
  );
}
