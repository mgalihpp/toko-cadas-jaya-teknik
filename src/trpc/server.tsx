import "server-only";

import {
  dehydrate,
  HydrationBoundary,
  type QueryClient,
} from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { headers } from "next/headers";
import { cache } from "react";
import { createCallerFactory, createTRPCContext } from "@/server/api/trpc";
import { makeQueryClient } from "./query-client";
import { appRouter } from "@/server/api/root";

export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: async () => createTRPCContext({ headers: await headers() }),
  router: appRouter,
  queryClient: getQueryClient,
});

export const caller = async () =>
  createCallerFactory(appRouter)(
    await createTRPCContext({ headers: await headers() })
  );

export function HydrateClient(props: { children: React.ReactNode }) {
  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      {props.children}
    </HydrationBoundary>
  );
}

export function prefetch(
  queryOptions: Parameters<QueryClient["prefetchQuery"]>[0]
) {
  void getQueryClient().prefetchQuery(queryOptions);
}
