import type { Metadata } from "next";
import { CheckoutPage } from "@/features/checkout";

export const metadata: Metadata = { title: "Checkout | Cadas Jaya Teknik" };

export default function Page() {
  return <CheckoutPage />;
}
