import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryEditForm } from "@/features/admin-categories";

export const metadata: Metadata = { title: "Ubah Kategori | Admin Cadas Jaya Teknik" };

export default function AdminEditCategoryPage({ params }: PageProps<"/admin/kategori/[id]">) {
  return (
    <Suspense>
      {params.then(({ id }) => (
        <CategoryEditForm id={id} />
      ))}
    </Suspense>
  );
}
