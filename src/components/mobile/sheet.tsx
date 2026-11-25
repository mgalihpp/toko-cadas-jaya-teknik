"use client";

import { Dialog } from "radix-ui";
import { cn } from "@/lib/utils";

export const SheetRoot = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;
export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;

function Overlay() {
  return (
    <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(10,31,51,.5)] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
  );
}

export function BottomSheet({
  className,
  children,
  title,
  ...props
}: Omit<React.ComponentProps<typeof Dialog.Content>, "title"> & { title: string }) {
  return (
    <Dialog.Portal>
      <Overlay />
      <Dialog.Content
        aria-describedby={undefined}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88svh] w-full max-w-[430px] flex-col rounded-t-[20px] bg-white outline-none data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom",
          className,
        )}
        {...props}
      >
        <Dialog.Title className="sr-only">{title}</Dialog.Title>
        <span className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-ink-300" aria-hidden />
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export function SideDrawer({
  className,
  children,
  title,
  ...props
}: Omit<React.ComponentProps<typeof Dialog.Content>, "title"> & { title: string }) {
  return (
    <Dialog.Portal>
      <Overlay />
      <Dialog.Content
        aria-describedby={undefined}
        className={cn(
          "fixed inset-y-0 left-1/2 z-50 flex w-[316px] max-w-[85vw] -translate-x-[min(215px,50vw)] flex-col rounded-r-[20px] bg-white shadow-[8px_0_30px_rgba(0,0,0,.25)] outline-none data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left",
          className,
        )}
        {...props}
      >
        <Dialog.Title className="sr-only">{title}</Dialog.Title>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
