import { cn } from "@/lib/utils";

export function AdminConditionBadge({ condition }: { condition: "baru" | "bekas" }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md px-2 text-xs font-semibold",
        condition === "baru"
          ? "bg-ink-900 text-white"
          : "bg-accent-yellow text-ink-900"
      )}
    >
      {condition === "baru" ? "Baru" : "Bekas"}
    </span>
  );
}
