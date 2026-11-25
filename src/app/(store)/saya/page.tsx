import type { Metadata } from "next";
import { AccountPage } from "@/features/account";

export const metadata: Metadata = { title: "Saya | Cadas Jaya Teknik" };

export default function Page() {
  return <AccountPage />;
}
