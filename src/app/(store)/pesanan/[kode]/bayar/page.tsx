import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentPage } from "@/features/orders";

export const metadata: Metadata = { title: "Pembayaran | Cadas Jaya Teknik" };

export default function Page({ params }: { params: Promise<{ kode: string }> }) {
  return (
    <Suspense>
      {params.then(({ kode }) => (
        <PaymentPage code={decodeURIComponent(kode)} />
      ))}
    </Suspense>
  );
}
