"use client";

import { useQuery } from "@tanstack/react-query";
import { HeartIcon } from "lucide-react";
import { MLink } from "@/components/mobile/m-button";
import { TopBar } from "@/components/mobile/top-bar";
import { EmptyState } from "@/components/shared";
import { ProductCard, ProductGridSkeleton } from "@/features/catalog";
import { useIsCustomer } from "@/features/cart";
import { useTRPC } from "@/trpc/client";

export function FavoritesPage() {
  const trpc = useTRPC();
  const { session, isPending: sessionPending, isCustomer } = useIsCustomer();
  const { data, isPending } = useQuery(trpc.favorites.list.queryOptions(undefined, { enabled: isCustomer }));

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Favorit saya" backHref="/saya" />
      {sessionPending || (isCustomer && isPending) ? (
        <ProductGridSkeleton count={4} />
      ) : !session || !isCustomer ? (
        <EmptyState
          icon={HeartIcon}
          title="Masuk untuk melihat favorit"
          description="Produk yang kamu sukai tersimpan di akunmu."
          action={
            <MLink href="/masuk?next=/favorit" className="h-[46px] px-6">
              Masuk
            </MLink>
          }
        />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={HeartIcon}
          title="Belum ada favorit"
          description="Ketuk ikon hati pada produk untuk menyimpannya di sini."
          action={
            <MLink href="/produk" className="h-[46px] px-6">
              Lihat katalog
            </MLink>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-2.5 px-3 py-2.5">
          {data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
