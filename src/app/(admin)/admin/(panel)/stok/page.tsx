import type { Metadata } from "next";
import { StockList } from "@/features/admin-stock";

export const metadata: Metadata = { title: "Stok | Admin Cadas Jaya Teknik" };

export default function AdminStockPage() {
  return <StockList />;
}
