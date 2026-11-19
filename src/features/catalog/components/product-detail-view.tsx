"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { catalogHref, RELATED_LIMIT, relatedProductsInput } from "../schemas";
import type { ProductDetail } from "../types";
import { CONTAINER } from "./container";
import { ProductBuyBox } from "./product-buy-box";
import { ProductCard } from "./product-card";
import { ProductGallery } from "./product-gallery";

const CONDITION_COPY = {
  baru: [
    "Unit baru tersegel dari distributor.",
    "Garansi resmi mengikuti ketentuan merek.",
    "Nota pembelian disertakan untuk klaim garansi.",
  ],
  bekas: [
    "Unit bekas sudah dicek dan diuji nyala sebelum dipajang.",
    "Foto di halaman ini adalah foto unit asli dari beberapa sisi.",
    "Stok bekas biasanya hanya satu unit dan dikunci begitu kamu checkout.",
  ],
} as const;

function ProductInfoTabs({ product }: { product: ProductDetail }) {
  const specs = Object.entries(product.specs ?? {}).filter(([key, value]) => key && value);
  const trigger =
    "h-auto! w-full flex-none justify-start rounded-lg border-0 px-4 py-3 text-[15px] font-medium text-ink-600 data-active:bg-ink-100 data-active:font-semibold data-active:text-ink-900 data-active:shadow-none";
  return (
    <Tabs
      defaultValue={specs.length > 0 ? "spesifikasi" : "deskripsi"}
      orientation="vertical"
      className="flex-col gap-6 lg:flex-row lg:gap-16"
    >
      <TabsList
        variant="line"
        className="h-auto w-full flex-row gap-1 overflow-x-auto p-0 lg:w-[260px] lg:shrink-0 lg:flex-col lg:self-start lg:overflow-visible"
      >
        <TabsTrigger value="spesifikasi" className={cn(trigger, "lg:w-full")}>
          Spesifikasi
        </TabsTrigger>
        <TabsTrigger value="deskripsi" className={cn(trigger, "lg:w-full")}>
          Deskripsi
        </TabsTrigger>
        <TabsTrigger value="kondisi" className={cn(trigger, "lg:w-full")}>
          Kondisi lengkap
        </TabsTrigger>
      </TabsList>
      <TabsContent value="spesifikasi" className="min-w-0">
        {specs.length > 0 ? (
          <dl className="flex flex-col">
            {specs.map(([key, value]) => (
              <div
                key={key}
                className="flex flex-col gap-1 border-b border-ink-200 py-4 sm:flex-row sm:gap-6"
              >
                <dt className="text-sm text-ink-500 sm:w-[280px] sm:shrink-0">{key}</dt>
                <dd className="text-sm font-medium text-ink-900">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="py-4 text-sm text-ink-500">Spesifikasi belum diisi untuk produk ini.</p>
        )}
      </TabsContent>
      <TabsContent value="deskripsi" className="min-w-0">
        {product.description ? (
          <p className="max-w-prose py-4 text-[15px] leading-relaxed whitespace-pre-line text-ink-700">
            {product.description}
          </p>
        ) : (
          <p className="py-4 text-sm text-ink-500">Deskripsi belum diisi untuk produk ini.</p>
        )}
      </TabsContent>
      <TabsContent value="kondisi" className="min-w-0">
        <ul className="flex flex-col gap-3 py-4">
          {CONDITION_COPY[product.condition].map((line) => (
            <li key={line} className="flex gap-2.5 text-[15px] text-ink-700">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </TabsContent>
    </Tabs>
  );
}

function RelatedProducts({ product }: { product: ProductDetail }) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.catalog.products.queryOptions(relatedProductsInput(product.categorySlug))
  );
  const items = data.items.filter((p) => p.id !== product.id).slice(0, RELATED_LIMIT);
  if (items.length === 0) return null;

  return (
    <section className="bg-ink-50 py-14 lg:pt-[72px] lg:pb-24" aria-labelledby="produk-serupa">
      <div className={cn(CONTAINER, "flex flex-col gap-7")}>
        <div className="flex items-end justify-between gap-4">
          <h2 id="produk-serupa" className="text-2xl font-bold text-ink-900 lg:text-[28px]">
            Produk serupa
          </h2>
          <Link
            href={catalogHref({ categorySlug: product.categorySlug })}
            className="text-sm font-semibold text-brand-700 hover:underline"
          >
            Lihat semua
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
          {items.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProductDetailView({ slug }: { slug: string }) {
  const trpc = useTRPC();
  const { data: product } = useSuspenseQuery(trpc.catalog.productBySlug.queryOptions({ slug }));

  return (
    <div className="flex flex-col">
      <nav
        aria-label="Breadcrumb"
        className={cn(CONTAINER, "flex flex-wrap items-center gap-1.5 pt-7 text-[13px]")}
      >
        <Link href="/" className="text-ink-500 hover:text-ink-900">
          Beranda
        </Link>
        <ChevronRightIcon className="size-3.5 text-ink-300" />
        <Link href="/produk" className="text-ink-500 hover:text-ink-900">
          Produk
        </Link>
        <ChevronRightIcon className="size-3.5 text-ink-300" />
        <Link
          href={catalogHref({ categorySlug: product.categorySlug })}
          className="text-ink-500 hover:text-ink-900"
        >
          {product.categoryName}
        </Link>
        <ChevronRightIcon className="size-3.5 text-ink-300" />
        <span className="line-clamp-1 font-semibold text-ink-900" aria-current="page">
          {product.name}
        </span>
      </nav>

      <div
        className={cn(
          CONTAINER,
          "grid gap-8 pt-7 pb-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16 lg:pb-[72px]"
        )}
      >
        <ProductGallery images={product.images} name={product.name} condition={product.condition} />
        <ProductBuyBox product={product} />
      </div>

      <section className={cn(CONTAINER, "pb-16 lg:pb-[88px]")} aria-label="Informasi produk">
        <ProductInfoTabs product={product} />
      </section>

      <Suspense fallback={null}>
        <RelatedProducts product={product} />
      </Suspense>
    </div>
  );
}
