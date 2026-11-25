import type { Metadata } from "next";
import { FavoritesPage } from "@/features/favorites";

export const metadata: Metadata = { title: "Favorit saya | Cadas Jaya Teknik" };

export default function Page() {
  return <FavoritesPage />;
}
