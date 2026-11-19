import Link from "next/link";
import { CogIcon } from "lucide-react";

type AuthShellProps = {
  imageUrl: string;
  quote: string;
  children: React.ReactNode;
};

export function AuthShell({ imageUrl, quote, children }: AuthShellProps) {
  return (
    <div className="flex min-h-svh flex-1 bg-white lg:p-5">
      <aside
        className="relative hidden w-[43%] max-w-[620px] shrink-0 flex-col justify-between overflow-hidden rounded-3xl bg-ink-900 bg-cover bg-center p-10 lg:flex"
        style={{
          backgroundImage: `linear-gradient(180deg, rgb(28 25 23 / 0.25), rgb(28 25 23 / 0.9)), url(${imageUrl})`,
        }}
      >
        <BrandLink tone="light" />
        <p className="font-heading text-[34px] leading-tight font-semibold text-balance text-white">
          {quote}
        </p>
      </aside>
      <main className="flex flex-1 flex-col px-4 py-8 sm:px-6 lg:items-center lg:justify-center">
        <div className="mb-10 lg:hidden">
          <BrandLink tone="dark" />
        </div>
        <div className="mx-auto w-full max-w-[400px] lg:mx-0">{children}</div>
      </main>
    </div>
  );
}

export function BrandMark({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span
      className={
        size === "lg"
          ? "flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-600 text-white"
          : "flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-brand-600 text-white"
      }
    >
      <CogIcon className={size === "lg" ? "size-[22px]" : "size-5"} aria-hidden />
    </span>
  );
}

function BrandLink({ tone }: { tone: "light" | "dark" }) {
  return (
    <Link href="/" className="flex w-fit items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <BrandMark />
      <span
        className={`font-heading text-[17px] font-bold ${tone === "light" ? "text-white" : "text-ink-900"}`}
      >
        Cadas Jaya Teknik
      </span>
    </Link>
  );
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-3xl font-bold text-ink-900 sm:text-4xl">{title}</h1>
      <p className="text-[15px] text-ink-600">{subtitle}</p>
    </div>
  );
}
