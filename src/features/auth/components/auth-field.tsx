"use client";

import { EyeIcon, EyeOffIcon, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type AuthFieldProps = Omit<React.ComponentProps<"input">, "id" | "value" | "onChange"> & {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  invalid?: boolean;
  hint?: React.ReactNode;
};

export function AuthField({
  id,
  label,
  icon: Icon,
  value,
  onValueChange,
  error,
  invalid,
  hint,
  type = "text",
  className,
  ...props
}: AuthFieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const bad = Boolean(error) || Boolean(invalid);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink-900">
        {label}
      </label>
      <div
        className={cn(
          "flex h-12 items-center gap-2 rounded-[10px] bg-white px-3",
          bad
            ? "animate-[cjt-shake_.4s_ease-in-out] border-2 border-error"
            : "border-[1.5px] border-ink-200 focus-within:border-2 focus-within:border-brand-600",
        )}
      >
        <Icon className="size-5 shrink-0 text-ink-500" strokeWidth={1.8} />
        <input
          id={id}
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          aria-invalid={bad || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-[15px] text-ink-900 outline-none placeholder:text-ink-500",
            className,
          )}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            className="text-ink-500"
          >
            {show ? (
              <EyeOffIcon className="size-5" strokeWidth={1.8} />
            ) : (
              <EyeIcon className="size-5" strokeWidth={1.8} />
            )}
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-error">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs font-medium text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}
