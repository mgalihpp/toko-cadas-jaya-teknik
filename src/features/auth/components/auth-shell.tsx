import { BrandMark as SiteBrandMark } from "@/components/layout/site-logo";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100svh-65px)] flex-1 items-center justify-center px-4 py-12 sm:px-6 md:min-h-[calc(100svh-77px)]">
      <div className="w-full max-w-[400px]">{children}</div>
    </div>
  );
}

export function BrandMark({ size = "md" }: { size?: "md" | "lg" }) {
  return <SiteBrandMark className={size === "lg" ? "size-10" : "size-9"} />;
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-2 text-center">
      <h1 className="font-heading text-3xl font-bold text-ink-900 sm:text-4xl">{title}</h1>
      <p className="text-[15px] text-ink-600">{subtitle}</p>
    </div>
  );
}
