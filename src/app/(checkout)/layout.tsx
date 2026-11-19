import { ArrowLeftIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { SiteLogo } from "@/components/layout";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
          <SiteLogo />
          <span className="hidden items-center gap-2 text-sm font-medium text-ink-600 sm:flex">
            <ShieldCheckIcon className="size-4 text-success" />
            Checkout aman
          </span>
          <Link
            href="/keranjang"
            className="flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:underline"
          >
            <ArrowLeftIcon className="size-4" />
            Kembali ke keranjang
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
