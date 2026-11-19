import type { Metadata } from "next";
import { ContactPage } from "@/features/contact";

export const metadata: Metadata = {
  title: "Kontak | Cadas Jaya Teknik",
  description: "Alamat, telepon, dan jam operasional toko Cadas Jaya Teknik.",
};

export default function KontakPage() {
  return <ContactPage />;
}
