import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderSuccess } from "@/features/orders";

export const metadata: Metadata = { title: "Pesanan berhasil | Cadas Jaya Teknik" };

export default function Page({ params }: { params: Promise<{ kode: string }> }) {
  return (
    <Suspense>
      {params.then(({ kode }) => (
        <OrderSuccess code={decodeURIComponent(kode)} />
      ))}
    </Suspense>
  );
}
