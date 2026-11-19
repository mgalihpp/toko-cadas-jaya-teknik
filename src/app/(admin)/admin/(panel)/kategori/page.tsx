import type { Metadata } from "next";
import { CategoryList } from "@/features/admin-categories";

export const metadata: Metadata = { title: "Kategori | Admin Cadas Jaya Teknik" };

export default function AdminCategoriesPage() {
  return <CategoryList />;
}
