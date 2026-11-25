import type { LucideIcon } from "lucide-react";
import { resolveCategoryIcon } from "@/lib/category-icons";

export function categoryIcon(slug: string, icon?: string | null): LucideIcon {
  return resolveCategoryIcon(icon, slug);
}
