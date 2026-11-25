"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsCustomer } from "@/features/cart";
import { useTRPC } from "@/trpc/client";

export function useUnreadNotifications() {
  const trpc = useTRPC();
  const { isCustomer } = useIsCustomer();
  const { data } = useQuery(
    trpc.notifications.unreadCount.queryOptions(undefined, {
      enabled: isCustomer,
      refetchInterval: 60_000,
    })
  );
  return isCustomer ? (data ?? 0) : 0;
}

export function useNotificationFeed() {
  const trpc = useTRPC();
  const { isCustomer } = useIsCustomer();
  return useQuery(trpc.notifications.list.queryOptions(undefined, { enabled: isCustomer }));
}

export function useMarkAllRead() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.notifications.markAllRead.mutationOptions({
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: trpc.notifications.list.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.notifications.unreadCount.queryKey() });
      },
    })
  );
}
