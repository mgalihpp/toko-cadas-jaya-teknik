import { TopBar } from "@/components/mobile/top-bar";
import { CatalogSkeleton } from "@/features/catalog";

export default function Loading() {
  return (
    <>
      <TopBar title="Katalog produk" backHref="/" />
      <CatalogSkeleton />
    </>
  );
}
