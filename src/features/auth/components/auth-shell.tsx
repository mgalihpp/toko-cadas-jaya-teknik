import { CogIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-1.5 bg-gradient-to-b from-brand-700 to-brand-500 px-5 pt-7 pb-10">
        <div className="flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-[10px] bg-white">
            <CogIcon className="size-6 text-brand-600" strokeWidth={1.8} />
          </span>
          <p className="text-xl font-bold text-white">Cadas Jaya Teknik</p>
        </div>
        <p className="text-sm text-[#CFE4F6]">Alat dan mesin teknik, baru dan bekas.</p>
      </div>
      {children}
    </div>
  );
}

export function AuthTabs({ active, next }: { active: "masuk" | "daftar"; next: string }) {
  const suffix = next === "/" ? "" : `?next=${encodeURIComponent(next)}`;
  const tab = (isActive: boolean) =>
    cn(
      "flex h-11 flex-1 items-center justify-center rounded-[9px] text-[15px] font-bold",
      isActive ? "bg-brand-600 text-white" : "text-ink-500",
    );
  return (
    <div className="relative z-10 mx-4 -mt-[22px] flex rounded-xl bg-white p-1 shadow-[0_4px_14px_rgba(10,40,70,.12)]">
      <Link
        href={`/masuk${suffix}`}
        className={tab(active === "masuk")}
        aria-current={active === "masuk" ? "page" : undefined}
      >
        Masuk
      </Link>
      <Link
        href={`/daftar${suffix}`}
        className={tab(active === "daftar")}
        aria-current={active === "daftar" ? "page" : undefined}
      >
        Daftar
      </Link>
    </div>
  );
}

export function AuthBanner({
  tone,
  title,
  children,
  icon: Icon = TriangleAlertIcon,
}: {
  tone: "info" | "error";
  title?: string;
  children: React.ReactNode;
  icon?: typeof TriangleAlertIcon;
}) {
  const palette =
    tone === "error"
      ? "border-error-border bg-error-soft text-error"
      : "border-info-border bg-info-soft text-brand-700";
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn("flex items-start gap-2.5 rounded-[10px] border p-3", palette)}
    >
      <Icon className="size-5 shrink-0" strokeWidth={2} />
      <div className="flex flex-col gap-0.5">
        {title ? <p className="text-sm font-bold">{title}</p> : null}
        <p className="text-[13px] text-ink-900">{children}</p>
      </div>
    </div>
  );
}

export function AuthFootnote() {
  return (
    <p className="text-center text-xs text-ink-500">
      Dengan lanjut, kamu setuju pada syarat dan{" "}
      <Link href="/privasi" className="font-medium text-brand-600">
        kebijakan privasi
      </Link>{" "}
      Cadas Jaya Teknik.
    </p>
  );
}
