import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderDetail } from "@/features/orders";

export const metadata: Metadata = { title: "Detail Pesanan" };

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ kode: string }>;
}) {
  return (
    <Suspense>
      {params.then(({ kode }) => (
        <OrderDetail code={decodeURIComponent(kode)} />
      ))}
    </Suspense>
  );
}
