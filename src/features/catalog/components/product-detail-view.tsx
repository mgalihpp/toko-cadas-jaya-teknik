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

function ProductInfoTabs({ product }: { product: ProductDetail }) {
  const specs = Object.entries(product.specs ?? {}).filter(([key, value]) => key && value);
  const trigger =
    "h-auto! flex-none rounded-none border-0 px-0 pb-3.5 text-[15px] font-medium text-ink-500 data-active:font-bold data-active:text-ink-900";
  return (
    <Tabs defaultValue="deskripsi" className="gap-6">
      <TabsList
        variant="line"
        className="h-auto w-full justify-start gap-8 overflow-x-auto border-b border-ink-200 p-0"
      >
        <TabsTrigger value="deskripsi" className={trigger}>
          Deskripsi
        </TabsTrigger>
        <TabsTrigger value="spesifikasi" className={trigger}>
          Spesifikasi
        </TabsTrigger>
        <TabsTrigger value="pengiriman" className={trigger}>
          Pengiriman
        </TabsTrigger>
      </TabsList>
      <TabsContent value="deskripsi" className="min-w-0">
        {product.description ? (
          <p className="max-w-prose text-[15px] leading-relaxed whitespace-pre-line text-ink-600">
            {product.description}
          </p>
        ) : (
          <p className="text-sm text-ink-500">Deskripsi belum diisi untuk produk ini.</p>
        )}
      </TabsContent>
      <TabsContent value="spesifikasi" className="min-w-0">
        {specs.length > 0 ? (
          <dl className="flex max-w-2xl flex-col">
            {specs.map(([key, value], i) => (
              <div
                key={key}
                className={cn(
                  "flex items-center justify-between gap-6 px-3.5 py-3 text-sm",
                  i % 2 === 0 && "bg-ink-50"
                )}
              >
                <dt className="text-ink-500">{key}</dt>
                <dd className="text-right font-semibold text-ink-900">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-ink-500">Spesifikasi belum diisi untuk produk ini.</p>
        )}
      </TabsContent>
      <TabsContent value="pengiriman" className="min-w-0">
        <ul className="flex max-w-prose flex-col gap-3 text-[15px] text-ink-600">
          <li>Ambil di toko: siap setelah pembayaran dikonfirmasi Owner.</li>
          <li>Dikirim: ongkir dikonfirmasi Owner setelah pesanan dibuat.</li>
          <li>Pembayaran tunai saat serah terima, atau transfer ke rekening toko dan unggah bukti.</li>
          <li>Pesanan transfer tanpa bukti dalam 24 jam dibatalkan otomatis dan stok dilepas.</li>
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
    <div className="flex flex-col pb-24 lg:pb-0">
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
          "grid gap-8 pt-6 pb-10 lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)] lg:gap-14 lg:pb-14"
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
