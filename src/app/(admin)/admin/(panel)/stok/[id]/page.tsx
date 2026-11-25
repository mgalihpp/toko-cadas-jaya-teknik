import type { Metadata } from "next";
import { Suspense } from "react";
import { StockList } from "@/features/admin-stock";

export const metadata: Metadata = { title: "Atur Stok | Admin Cadas Jaya Teknik" };

export default function AdminAdjustStockPage({ params }: PageProps<"/admin/stok/[id]">) {
  return (
    <Suspense>
      {params.then(({ id }) => (
        <StockList adjustId={id} />
      ))}
    </Suspense>
  );
}
