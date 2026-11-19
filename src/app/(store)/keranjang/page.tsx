import type { Metadata } from "next";
import { CartPage } from "@/features/cart";

export const metadata: Metadata = { title: "Keranjang | Cadas Jaya Teknik" };

export default function Page() {
  return <CartPage />;
}
