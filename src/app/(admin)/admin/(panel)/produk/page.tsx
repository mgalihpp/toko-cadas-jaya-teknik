import type { Metadata } from "next";
import { ProductList } from "@/features/admin-products";

export const metadata: Metadata = { title: "Produk | Admin Cadas Jaya Teknik" };

export default function AdminProductsPage() {
  return <ProductList />;
}
