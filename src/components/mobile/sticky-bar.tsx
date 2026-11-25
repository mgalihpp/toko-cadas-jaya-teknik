import { cn } from "@/lib/utils";

export function StickyBar({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 mx-auto flex min-h-[76px] w-full max-w-[430px] items-center gap-2.5 border-t border-ink-200 bg-white px-3 pt-2 pb-2.5 shadow-[0_-4px_16px_rgba(10,40,70,.06)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
