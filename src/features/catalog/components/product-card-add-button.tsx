"use client";

import { ShoppingCartIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAddToCart } from "../hooks/use-add-to-cart";

export function ProductCardAddButton({
  productId,
  name,
  soldOut,
}: {
  productId: string;
  name: string;
  soldOut: boolean;
}) {
  const { addToCart, isPending } = useAddToCart();

  if (soldOut) {
    return (
      <Button variant="secondary" disabled className="h-10 w-full text-ink-500">
        Stok habis
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      disabled={isPending}
      className="relative z-10 h-10 w-full whitespace-nowrap border-ink-900 text-ink-900 hover:bg-ink-50"
      onClick={async () => {
        if (await addToCart(productId, 1)) toast.success(`${name} masuk ke keranjang`);
      }}
    >
      <ShoppingCartIcon />
      {isPending ? "Menambahkan..." : (
        <span>
          Tambah<span className="hidden @[13rem]:inline"> ke keranjang</span>
        </span>
      )}
    </Button>
  );
}
