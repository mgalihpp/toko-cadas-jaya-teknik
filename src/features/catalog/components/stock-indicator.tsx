import { cn } from "@/lib/utils";

export type StockLevel = "tersedia" | "terakhir" | "habis";

export function stockLevel(available: number): StockLevel {
  if (available <= 0) return "habis";
  if (available === 1) return "terakhir";
  return "tersedia";
}

const TONE: Record<StockLevel, string> = {
  tersedia: "text-success",
  terakhir: "text-warning",
  habis: "text-error",
};

export function stockLabel(available: number): string {
  const level = stockLevel(available);
  if (level === "habis") return "Habis";
  if (level === "terakhir") return "Tersisa 1";
  return `Stok ${available}`;
}

export function StockIndicator({
  available,
  className,
}: {
  available: number;
  className?: string;
}) {
  const level = stockLevel(available);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 text-xs font-medium",
        TONE[level],
        className
      )}
    >
      <span aria-hidden className="size-[7px] rounded-full bg-current" />
      {stockLabel(available)}
    </span>
  );
}
