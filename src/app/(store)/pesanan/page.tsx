import type { Metadata } from "next";
import { OrderHistory } from "@/features/orders";

export const metadata: Metadata = { title: "Pesanan saya" };

export default function OrdersPage() {
  return <OrderHistory />;
}
