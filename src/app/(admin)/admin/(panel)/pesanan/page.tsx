import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminOrderList } from "@/features/admin-orders";

export const metadata: Metadata = { title: "Pesanan | Admin Cadas Jaya Teknik" };

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <AdminOrderList />
    </Suspense>
  );
}
