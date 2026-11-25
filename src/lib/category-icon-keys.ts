export const CATEGORY_ICON_KEYS = [
  "drill",
  "hammer",
  "wrench",
  "disc",
  "circle-dashed",
  "ruler",
  "zap",
  "gauge",
  "scissors",
  "cog",
  "plug",
  "flame",
  "fan",
  "pickaxe",
  "axe",
  "folder",
] as const;

export type CategoryIconKey = (typeof CATEGORY_ICON_KEYS)[number];
