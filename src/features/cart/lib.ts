import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

export type CartData = inferRouterOutputs<AppRouter>["cart"]["list"];
export type CartItem = CartData["items"][number];

export const MAX_QTY = 999;

export type StockState =
  | { kind: "habis"; label: string }
  | { kind: "kurang"; label: string }
  | { kind: "terakhir"; label: string }
  | { kind: "tersedia"; label: string };

export function stockState(item: CartItem): StockState {
  if (!item.isActive || item.available <= 0) {
    return { kind: "habis", label: "Stok habis" };
  }
  if (item.available < item.quantity) {
    return {
      kind: "kurang",
      label: `Stok berubah, tersisa ${item.available}. Kurangi jumlahnya.`,
    };
  }
  if (item.available === item.quantity) {
    return {
      kind: "terakhir",
      label:
        item.available === 1
          ? "Unit terakhir, maksimal 1"
          : `Stok tersisa ${item.available}, maksimal ${item.available}`,
    };
  }
  return { kind: "tersedia", label: `Stok ${item.available}` };
}

export function maxQuantity(item: CartItem) {
  return Math.max(Math.min(item.available, MAX_QTY), 1);
}

export function summarize(items: CartItem[]) {
  const purchasable = items.filter((i) => i.purchasable);
  return {
    purchasable,
    unavailableCount: items.length - purchasable.length,
    quantity: purchasable.reduce((s, i) => s + i.quantity, 0),
    subtotal: purchasable.reduce((s, i) => s + i.price * i.quantity, 0),
  };
}
