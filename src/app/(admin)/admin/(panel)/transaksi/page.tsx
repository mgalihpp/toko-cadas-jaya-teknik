import type { Metadata } from "next";
import { Suspense } from "react";
import { TransactionList } from "@/features/admin-transactions";

export const metadata: Metadata = { title: "Transaksi | Admin Cadas Jaya Teknik" };

export default function AdminTransactionsPage() {
  return (
    <Suspense>
      <TransactionList />
    </Suspense>
  );
}
