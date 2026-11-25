import {
  AxeIcon,
  CircleDashedIcon,
  CogIcon,
  DiscIcon,
  DrillIcon,
  FanIcon,
  FlameIcon,
  FolderIcon,
  GaugeIcon,
  HammerIcon,
  PickaxeIcon,
  PlugIcon,
  RulerIcon,
  ScissorsIcon,
  WrenchIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react";
import type { CategoryIconKey } from "./category-icon-keys";

export const CATEGORY_ICONS: Record<CategoryIconKey, { label: string; Icon: LucideIcon }> = {
  drill: { label: "Bor", Icon: DrillIcon },
  hammer: { label: "Palu", Icon: HammerIcon },
  wrench: { label: "Kunci", Icon: WrenchIcon },
  disc: { label: "Gerinda", Icon: DiscIcon },
  "circle-dashed": { label: "Sirkel", Icon: CircleDashedIcon },
  ruler: { label: "Serut", Icon: RulerIcon },
  zap: { label: "Listrik", Icon: ZapIcon },
  gauge: { label: "Kompresor", Icon: GaugeIcon },
  scissors: { label: "Potong", Icon: ScissorsIcon },
  cog: { label: "Mesin", Icon: CogIcon },
  plug: { label: "Kabel", Icon: PlugIcon },
  flame: { label: "Las", Icon: FlameIcon },
  fan: { label: "Kipas", Icon: FanIcon },
  pickaxe: { label: "Beliung", Icon: PickaxeIcon },
  axe: { label: "Kapak", Icon: AxeIcon },
  folder: { label: "Umum", Icon: FolderIcon },
};

const FALLBACK_BY_SLUG: [string, CategoryIconKey][] = [
  ["bor", "drill"],
  ["gerinda", "disc"],
  ["sirkel", "circle-dashed"],
  ["serut", "ruler"],
  ["las", "zap"],
  ["kompresor", "gauge"],
  ["cutting", "scissors"],
  ["potong", "scissors"],
  ["palu", "hammer"],
  ["hammer", "hammer"],
  ["aksesoris", "wrench"],
];

export function resolveCategoryIcon(icon: string | null | undefined, slug: string): LucideIcon {
  if (icon && icon in CATEGORY_ICONS) return CATEGORY_ICONS[icon as CategoryIconKey].Icon;
  const words = slug.split("-");
  const key = FALLBACK_BY_SLUG.find(([word]) => words.includes(word))?.[1] ?? "folder";
  return CATEGORY_ICONS[key].Icon;
}
