"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";

function errorCode(error: unknown): string | undefined {
  if (!(error instanceof TRPCClientError)) return undefined;
  const data = error.data as { code?: string } | undefined;
  return data?.code;
}

export function useAddToCart() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const mutation = useMutation(trpc.cart.add.mutationOptions());

  const goToLogin = () => {
    router.push(`/masuk?next=${encodeURIComponent(pathname)}`);
  };

  async function addToCart(productId: string, quantity: number): Promise<boolean> {
    if (!session.data) {
      toast.info("Masuk dulu untuk menambahkan ke keranjang");
      goToLogin();
      return false;
    }
    try {
      await mutation.mutateAsync({ productId, quantity });
      await queryClient.invalidateQueries({ queryKey: trpc.cart.pathKey() });
      return true;
    } catch (error) {
      const code = errorCode(error);
      if (code === "UNAUTHORIZED") {
        goToLogin();
        return false;
      }
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Gagal menambahkan ke keranjang. Coba lagi.";
      toast.error(message);
      return false;
    }
  }

  return {
    addToCart,
    isPending: mutation.isPending,
    isSessionLoading: session.isPending,
  };
}
