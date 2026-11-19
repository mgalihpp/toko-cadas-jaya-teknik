"use client";

import { ArrowLeft, PackageX } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function StockConflictDialog({
  message,
  onOpenChange,
  onContinue,
  continuing,
  canContinue,
}: {
  message: string | null;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  continuing: boolean;
  canContinue: boolean;
}) {
  return (
    <AlertDialog open={message !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-3.5 text-left">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-error-soft text-error">
              <PackageX className="size-5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <AlertDialogTitle className="font-heading text-lg">
                Produk baru saja habis
              </AlertDialogTitle>
              <AlertDialogDescription>
                {message}. Stok baru saja dipesan pelanggan lain sebelum kamu menyelesaikan
                checkout. Perbarui keranjang dulu agar pesanan bisa dibuat.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <Button asChild variant="outline" size="lg" className="h-10">
            <Link href="/keranjang">
              <ArrowLeft />
              Kembali ke keranjang
            </Link>
          </Button>
          {canContinue ? (
            <Button size="lg" className="h-10" onClick={onContinue} disabled={continuing}>
              {continuing ? <Spinner /> : null}
              Lanjut tanpa produk ini
            </Button>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
