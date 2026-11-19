import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminDashboard } from "@/features/admin-dashboard";

export const metadata: Metadata = { title: "Dashboard | Admin Cadas Jaya Teknik" };

export default function AdminDashboardPage() {
  return (
    <Suspense>
      <AdminDashboard />
    </Suspense>
  );
}
