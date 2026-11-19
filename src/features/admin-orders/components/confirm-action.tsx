"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type ConfirmActionProps = {
  trigger: React.ReactNode;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  confirmClassName?: string;
  destructive?: boolean;
  pending: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
  onConfirm: () => Promise<unknown>;
};

export function ConfirmAction({
  trigger,
  title,
  description,
  confirmLabel,
  confirmClassName,
  destructive,
  pending,
  disabled,
  children,
  onOpenChange,
  onConfirm,
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false);

  function changeOpen(next: boolean) {
    if (pending) return;
    setOpen(next);
    onOpenChange?.(next);
  }

  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="data-[size=default]:sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <Button
            variant={destructive ? "destructive" : "default"}
            className={confirmClassName}
            disabled={pending || disabled}
            onClick={async () => {
              try {
                await onConfirm();
                setOpen(false);
                onOpenChange?.(false);
              } catch {
                // Pesan galat sudah ditampilkan lewat toast di hook mutasi.
              }
            }}
          >
            {pending ? <Spinner /> : null}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
