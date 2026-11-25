import { PackageXIcon } from "lucide-react";
import { MLink } from "@/components/mobile/m-button";
import { TopBar } from "@/components/mobile/top-bar";
import { EmptyState, ErrorState } from "@/components/shared";

export function ProductNotFound() {
  return (
    <>
      <TopBar title="Produk" backHref="/produk" />
      <EmptyState
        icon={PackageXIcon}
        title="Produk ini sudah tidak tersedia"
        description="Mungkin sudah terjual atau dinonaktifkan Owner."
        action={<MLink href="/produk" className="h-[46px] px-6">Kembali ke katalog</MLink>}
      />
    </>
  );
}

export function CatalogLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <>
      <TopBar title="Katalog produk" backHref="/" cart={false} />
      <ErrorState
        onRetry={onRetry}
        secondary={
          <MLink href="/" variant="secondary" className="h-[46px] px-6">
            Lihat produk tersimpan
          </MLink>
        }
      />
    </>
  );
}
