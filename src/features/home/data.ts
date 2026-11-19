import "server-only";

import { cache } from "react";
import { caller } from "@/trpc/server";

export const getCategories = cache(async () => (await caller()).catalog.categories());

export const getLatestProducts = cache(async () => (await caller()).catalog.home());

export const getUsedPicks = cache(async () =>
  (await caller()).catalog.products({ condition: "bekas", pageSize: 3 })
);

export const getStoreSettings = cache(async () => (await caller()).settings.get());
