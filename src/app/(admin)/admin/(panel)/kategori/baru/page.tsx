import type { Metadata } from "next";
import { CategoryCreateForm } from "@/features/admin-categories";

export const metadata: Metadata = { title: "Tambah Kategori | Admin Cadas Jaya Teknik" };

export default function AdminNewCategoryPage() {
  return <CategoryCreateForm />;
}
