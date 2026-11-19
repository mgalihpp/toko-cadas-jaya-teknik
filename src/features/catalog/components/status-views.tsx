import { WifiOffIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CONTAINER } from "./container";

export function ProductNotFound() {
  return (
    <div className={cn(CONTAINER, "flex flex-col items-center gap-4 py-24 text-center")}>
      <p className="font-heading text-8xl font-bold text-brand-600">404</p>
      <h1 className="text-xl font-semibold text-ink-900">Produk ini sudah tidak tersedia</h1>
      <p className="text-sm text-ink-600">Mungkin sudah terjual atau dinonaktifkan Owner.</p>
      <Button asChild className="mt-2 h-10 px-4 font-semibold">
        <Link href="/produk">Kembali ke Katalog</Link>
      </Button>
    </div>
  );
}

export function CatalogLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={cn(CONTAINER, "flex flex-col items-center gap-4 py-24 text-center")}>
      <span className="flex size-16 items-center justify-center rounded-full bg-error-soft text-error">
        <WifiOffIcon className="size-7" />
      </span>
      <h1 className="text-xl font-semibold text-ink-900">Koneksi terputus</h1>
      <p className="max-w-[340px] text-sm text-ink-600">
        Data produk belum bisa dimuat. Periksa internet lalu coba lagi.
      </p>
      <Button variant="outline" className="h-10 border-ink-300 px-4 font-semibold" onClick={onRetry}>
        Coba lagi
      </Button>
    </div>
  );
}
