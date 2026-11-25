import type { Metadata } from "next";
import { NotificationsPage } from "@/features/notifications";

export const metadata: Metadata = { title: "Notifikasi | Cadas Jaya Teknik" };

export default function Page() {
  return <NotificationsPage />;
}
