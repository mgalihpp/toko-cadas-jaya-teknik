import type { Metadata } from "next";
import { AdminLoginPage } from "@/features/auth/server";

export const metadata: Metadata = { title: "Masuk Admin | Cadas Jaya Teknik" };

export default function Page() {
  return <AdminLoginPage />;
}
