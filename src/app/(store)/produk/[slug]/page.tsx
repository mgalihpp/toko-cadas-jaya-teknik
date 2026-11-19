import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ProductDetailView, relatedProductsInput } from "@/features/catalog";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

async function loadProduct(slug: string) {
  await connection();
  try {
    return await getQueryClient().fetchQuery(trpc.catalog.productBySlug.queryOptions({ slug }));
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") return null;
    throw error;
  }
}

export async function generateMetadata(props: PageProps<"/produk/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await loadProduct(slug);
  if (!product) return { title: "Produk tidak ditemukan | Cadas Jaya Teknik" };
  const image = product.images[0]?.url;
  return {
    title: `${product.name} | Cadas Jaya Teknik`,
    description:
      product.description.slice(0, 160) ||
      `${product.name}, kondisi ${product.condition}, kategori ${product.categoryName}.`,
    openGraph: image ? { images: [image] } : undefined,
  };
}

export default async function ProductPage(props: PageProps<"/produk/[slug]">) {
  const { slug } = await props.params;
  const product = await loadProduct(slug);
  if (!product) notFound();

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.catalog.products.queryOptions(relatedProductsInput(product.categorySlug)));

  return (
    <HydrateClient>
      <ProductDetailView slug={slug} />
    </HydrateClient>
  );
}
