"use client";

import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { StoreIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { todayHours } from "@/features/admin-settings/hours";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { catalogHref, RELATED_LIMIT, relatedProductsInput } from "../schemas";
import type { ProductDetail } from "../types";
import { ProductBuyBar } from "./product-buy-box";
import { ProductBadge, ProductCard } from "./product-card";
import { ProductGallery } from "./product-gallery";

function Divider() {
  return <div className="h-2 shrink-0 bg-ink-50" />;
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-ink-200 py-[9px] last:border-b-0">
      <dt className="w-[110px] shrink-0 text-sm text-ink-500">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm font-medium text-ink-900">{value}</dd>
    </div>
  );
}

function StoreCard() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.settings.get.queryOptions());
  const hours = data?.openingHours ? todayHours(data.openingHours) : null;
  return (
    <section className="flex items-center gap-2.5 bg-white p-3">
      <span className="flex size-11 items-center justify-center rounded-full bg-brand-100">
        <StoreIcon className="size-6 text-brand-600" strokeWidth={1.8} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-[15px] font-bold text-ink-900">Cadas Jaya Teknik</p>
        {hours ? (
          <p className={cn("text-xs font-medium", hours.open ? "text-success" : "text-ink-500")}>
            {hours.open
              ? `Buka hari ini ${hours.from.replace(":", ".")} – ${hours.to.replace(":", ".")}`
              : "Tutup hari ini"}
          </p>
        ) : null}
      </div>
      <Link
        href="/kontak"
        className="rounded-lg border-[1.5px] border-brand-600 px-3 py-2 text-[13px] font-bold text-brand-700"
      >
        Lihat kontak
      </Link>
    </section>
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
    <>
      <Divider />
      <section className="flex flex-col gap-2.5 bg-white p-3" aria-labelledby="produk-serupa">
        <div className="flex items-center">
          <h2 id="produk-serupa" className="flex-1 text-base font-bold text-ink-900">
            Produk serupa
          </h2>
          <Link
            href={catalogHref({ categorySlug: product.categorySlug })}
            className="text-[13px] font-bold text-brand-600"
          >
            Semua
          </Link>
        </div>
        <div className="cjt-no-scrollbar flex gap-2.5 overflow-x-auto">
          {items.map((item) => (
            <ProductCard key={item.id} product={item} className="w-[138px] shrink-0" />
          ))}
        </div>
      </section>
    </>
  );
}

export function ProductDetailView({ slug }: { slug: string }) {
  const trpc = useTRPC();
  const { data: product } = useSuspenseQuery(trpc.catalog.productBySlug.queryOptions({ slug }));
  const available = Math.max(0, Number(product.available));
  const used = product.condition === "bekas";
  const specs = Object.entries(product.specs ?? {}).filter(([key, value]) => key && value);

  return (
    <div className="flex flex-1 flex-col pb-[76px]">
      <ProductGallery productId={product.id} images={product.images} name={product.name} />

      <section className="flex flex-col gap-2 bg-white p-3">
        <div className="flex items-center gap-1.5">
          <ProductBadge kind={product.condition} />
          {available <= 0 ? <ProductBadge kind="habis" /> : null}
        </div>
        <p className="text-[26px] leading-[1.35] font-bold text-brand-700">{formatRupiah(product.price)}</p>
        <h1 className="text-base leading-[1.35] font-medium text-ink-900">{product.name}</h1>
        {used && available > 0 ? (
          <div className="flex gap-2.5 rounded-[10px] border border-warning-border bg-warning-soft p-3">
            <TriangleAlertIcon className="size-5 shrink-0 text-warning" strokeWidth={2} />
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-bold text-warning">Barang bekas, stok {available} unit</p>
              <p className="text-[13px] text-ink-900">
                {available === 1
                  ? "Hanya tersisa 1 unit. Stok dikunci saat kamu checkout, jadi tidak bisa dipesan orang lain."
                  : `Tersisa ${available} unit. Stok dikunci saat kamu checkout.`}
              </p>
            </div>
          </div>
        ) : null}
        {available <= 0 ? (
          <div className="flex gap-2.5 rounded-[10px] border border-error-border bg-error-soft p-3">
            <TriangleAlertIcon className="size-5 shrink-0 text-error" strokeWidth={2} />
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-bold text-error">Stok habis</p>
              <p className="text-[13px] text-ink-900">
                Unit ini sedang tidak tersedia. Cek lagi nanti atau lihat produk serupa di bawah.
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <Divider />
      <section className="bg-white p-3">
        <h2 className="text-base font-bold text-ink-900">Spesifikasi</h2>
        <dl className="flex flex-col">
          <SpecRow label="Kondisi" value={used ? "Bekas" : "Baru"} />
          <SpecRow label="Kategori" value={product.categoryName} />
          {specs.map(([key, value]) => (
            <SpecRow key={key} label={key} value={value} />
          ))}
          <SpecRow label="Stok" value={`${available} unit`} />
        </dl>
      </section>

      <Divider />
      <section className="flex flex-col gap-2 bg-white p-3">
        <h2 className="text-base font-bold text-ink-900">Deskripsi produk</h2>
        <p className="text-sm leading-normal whitespace-pre-line text-ink-900">
          {product.description || "Deskripsi belum diisi untuk produk ini."}
        </p>
      </section>

      <Divider />
      <StoreCard />

      <Suspense fallback={null}>
        <RelatedProducts product={product} />
      </Suspense>

      <ProductBuyBar product={product} />
    </div>
  );
}
