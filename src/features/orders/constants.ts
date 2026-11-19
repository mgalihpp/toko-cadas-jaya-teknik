import type { OrderStatus } from "./types";

export const ORDER_TABS = [
  { value: "semua", label: "Semua", statuses: null },
  {
    value: "belum-dibayar",
    label: "Belum dibayar",
    statuses: ["menunggu_pembayaran", "menunggu_konfirmasi"],
  },
  { value: "diproses", label: "Diproses", statuses: ["dibayar", "diproses"] },
  { value: "selesai", label: "Selesai", statuses: ["selesai"] },
  { value: "dibatalkan", label: "Dibatalkan", statuses: ["dibatalkan"] },
] as const satisfies readonly {
  value: string;
  label: string;
  statuses: readonly OrderStatus[] | null;
}[];

export type OrderTab = (typeof ORDER_TABS)[number]["value"];

export const PROOF_ACCEPT = ["image/jpeg", "image/png", "image/webp"];
export const PROOF_MAX_BYTES = 2 * 1024 * 1024;

export function canUploadProof(order: {
  paymentMethod: "tunai" | "transfer";
  status: OrderStatus;
}) {
  return order.paymentMethod === "transfer" && order.status === "menunggu_pembayaran";
}

export function canCancel(order: { status: OrderStatus }) {
  return order.status === "menunggu_pembayaran" || order.status === "menunggu_konfirmasi";
}
