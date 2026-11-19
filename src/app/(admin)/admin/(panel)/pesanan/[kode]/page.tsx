import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminOrderDetail } from "@/features/admin-orders";

export const metadata: Metadata = { title: "Detail Pesanan | Admin Cadas Jaya Teknik" };

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ kode: string }>;
}) {
  return (
    <Suspense>
      {params.then(({ kode }) => (
        <AdminOrderDetail code={decodeURIComponent(kode)} />
      ))}
    </Suspense>
  );
}
