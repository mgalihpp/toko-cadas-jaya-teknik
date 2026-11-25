import Link from "next/link";
import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-brand-600 text-white disabled:bg-ink-300 disabled:text-ink-600",
  secondary: "bg-brand-100 text-brand-700 disabled:bg-ink-100 disabled:text-ink-500",
  outline:
    "border-[1.5px] border-brand-600 bg-white text-brand-700 disabled:border-ink-300 disabled:text-ink-500",
  danger: "bg-error text-white disabled:bg-ink-300 disabled:text-ink-600",
  dangerOutline: "border-[1.5px] border-error bg-white text-error disabled:opacity-50",
  success: "bg-success text-white disabled:bg-ink-300 disabled:text-ink-600",
} as const;

const SIZES = {
  md: "h-12 px-4 text-[15px]",
  lg: "h-[50px] px-4 text-[15px]",
  sm: "h-11 px-4 text-sm",
} as const;

export type MButtonVariant = keyof typeof VARIANTS;

type Common = {
  variant?: MButtonVariant;
  size?: keyof typeof SIZES;
  loading?: boolean;
  block?: boolean;
};

export function mButtonClass({ variant = "primary", size = "md", block }: Common = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-[10px] font-bold whitespace-nowrap transition-opacity active:opacity-80 disabled:cursor-not-allowed",
    VARIANTS[variant],
    SIZES[size],
    block && "w-full",
  );
}

export function MButton({
  variant,
  size,
  block,
  loading,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: Common & React.ComponentProps<"button">) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(mButtonClass({ variant, size, block }), className)}
      {...props}
    >
      {loading ? <Loader2Icon className="size-[18px] animate-spin" /> : null}
      {children}
    </button>
  );
}

export function MLink({
  variant,
  size,
  block,
  className,
  ...props
}: Common & React.ComponentProps<typeof Link>) {
  return <Link className={cn(mButtonClass({ variant, size, block }), className)} {...props} />;
}
