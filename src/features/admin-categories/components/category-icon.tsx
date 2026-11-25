import { createElement } from "react";
import { resolveCategoryIcon } from "@/lib/category-icons";

export function CategoryIcon({
  slug,
  icon,
  className,
}: {
  slug: string;
  icon?: string | null;
  className?: string;
}) {
  return createElement(resolveCategoryIcon(icon, slug), { className, "aria-hidden": true });
}
