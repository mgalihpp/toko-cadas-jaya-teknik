import type { Metadata } from "next";
import { SalesReport } from "@/features/admin-reports";

export const metadata: Metadata = { title: "Laporan Penjualan | Admin Cadas Jaya Teknik" };

export default function AdminReportPage() {
  return <SalesReport />;
}
