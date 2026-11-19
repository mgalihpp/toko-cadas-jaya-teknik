import {
  CircleDashedIcon,
  DiscIcon,
  DrillIcon,
  GaugeIcon,
  HammerIcon,
  type LucideIcon,
  RulerIcon,
  ScissorsIcon,
  WrenchIcon,
  ZapIcon,
} from "lucide-react";

const ICONS: [string, LucideIcon][] = [
  ["hammer", HammerIcon],
  ["gerinda", DiscIcon],
  ["sirkel", CircleDashedIcon],
  ["serut", RulerIcon],
  ["las", ZapIcon],
  ["kompresor", GaugeIcon],
  ["cutting", ScissorsIcon],
  ["potong", ScissorsIcon],
  ["bor", DrillIcon],
];

export function categoryIcon(slug: string): LucideIcon {
  return ICONS.find(([key]) => slug.includes(key))?.[1] ?? WrenchIcon;
}
