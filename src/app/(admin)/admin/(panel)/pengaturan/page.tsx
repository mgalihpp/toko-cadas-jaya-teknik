import type { Metadata } from "next";
import { StoreSettings } from "@/features/admin-settings";

export const metadata: Metadata = { title: "Pengaturan Toko | Admin Cadas Jaya Teknik" };

export default function AdminSettingsPage() {
  return <StoreSettings />;
}
