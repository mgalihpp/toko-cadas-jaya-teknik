import type { OrderStatus } from "@/components/shared";
import type { Fulfillment, PaymentMethod, PaymentStatus } from "./types";

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  "menunggu_pembayaran",
  "menunggu_konfirmasi",
  "dibayar",
  "diproses",
  "selesai",
  "dibatalkan",
];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  tunai: "Tunai",
  transfer: "Transfer",
};

export const FULFILLMENT_LABEL: Record<Fulfillment, string> = {
  kirim: "Dikirim",
  ambil: "Ambil",
};

export const ORDER_STATUS_DOT: Record<OrderStatus, string> = {
  menunggu_pembayaran: "bg-warning",
  menunggu_konfirmasi: "bg-info",
  dibayar: "bg-success",
  diproses: "bg-brand-700",
  selesai: "bg-ink-700",
  dibatalkan: "bg-error",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  menunggu: "Menunggu",
  diterima: "Diterima",
  ditolak: "Ditolak",
};

export function isOrderStatus(value: string | null | undefined): value is OrderStatus {
  return ORDER_STATUS_ORDER.includes(value as OrderStatus);
}
