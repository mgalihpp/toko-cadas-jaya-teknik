import { HomeIcon, LockIcon } from "lucide-react";
import { MLink } from "@/components/mobile/m-button";
import { TopBar } from "@/components/mobile/top-bar";

export function AccessDenied() {
  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Panel Admin" backHref="/" cart={false} />
      <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
        <span className="flex size-[110px] items-center justify-center rounded-full bg-warning-soft">
          <LockIcon className="size-12 text-warning" strokeWidth={1.6} />
        </span>
        <h2 className="text-xl font-bold text-ink-900">Akses khusus Owner</h2>
        <p className="text-sm text-ink-500">
          Halaman ini hanya bisa dibuka akun Admin atau Owner. Masuk dengan akun yang sesuai.
        </p>
        <MLink href="/admin/masuk" className="px-7">
          <LockIcon className="size-[18px]" />
          Masuk sebagai Owner
        </MLink>
        <MLink href="/" variant="secondary" className="h-[46px] px-6">
          <HomeIcon className="size-[18px]" />
          Kembali ke beranda
        </MLink>
      </div>
    </div>
  );
}
