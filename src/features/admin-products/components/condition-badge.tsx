import { cn } from "@/lib/utils";

export function AdminConditionBadge({ condition }: { condition: "baru" | "bekas" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs/[15px] font-semibold",
        condition === "baru" ? "bg-ink-900 text-white" : "bg-accent-yellow text-ink-900"
      )}
    >
      {condition === "baru" ? "Baru" : "Bekas"}
    </span>
  );
}
