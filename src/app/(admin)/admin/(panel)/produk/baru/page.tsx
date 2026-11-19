import type { Metadata } from "next";
import { ProductCreateForm } from "@/features/admin-products";

export const metadata: Metadata = { title: "Tambah Produk | Admin Cadas Jaya Teknik" };

export default function AdminNewProductPage() {
  return <ProductCreateForm />;
}
