import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductEditForm } from "@/features/admin-products";

export const metadata: Metadata = { title: "Edit Produk | Admin Cadas Jaya Teknik" };

export default function AdminEditProductPage({ params }: PageProps<"/admin/produk/[id]">) {
  return (
    <Suspense>
      {params.then(({ id }) => (
        <ProductEditForm id={id} />
      ))}
    </Suspense>
  );
}
