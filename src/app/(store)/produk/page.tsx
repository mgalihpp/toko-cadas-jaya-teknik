import type { Metadata } from "next";
import { connection } from "next/server";
import {
  CatalogView,
  parseCatalogSearchParams,
  toProductListInput,
} from "@/features/catalog";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Katalog Produk | Cadas Jaya Teknik",
  description:
    "Cari bor, gerinda, kompresor, trafo las, dan alat teknik lain, baru maupun bekas, lengkap dengan harga dan stok.",
};

export default async function CatalogPage(props: PageProps<"/produk">) {
  const filters = parseCatalogSearchParams(await props.searchParams);
  await connection();
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.catalog.products.queryOptions(toProductListInput(filters)));
  void queryClient.prefetchQuery(trpc.catalog.categories.queryOptions());

  return (
    <HydrateClient>
      <CatalogView filters={filters} />
    </HydrateClient>
  );
}
