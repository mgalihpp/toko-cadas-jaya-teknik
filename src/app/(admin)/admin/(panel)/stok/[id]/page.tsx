import type { Metadata } from "next";
import { Suspense } from "react";
import { AdjustStockPage } from "@/features/admin-stock";

export const metadata: Metadata = { title: "Sesuaikan Stok | Admin Cadas Jaya Teknik" };

export default function AdminAdjustStockPage({ params }: PageProps<"/admin/stok/[id]">) {
  return (
    <Suspense>
      {params.then(({ id }) => (
        <AdjustStockPage productId={id} />
      ))}
    </Suspense>
  );
}
