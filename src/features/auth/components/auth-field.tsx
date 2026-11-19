"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type AuthFieldProps = Omit<React.ComponentProps<"input">, "id" | "value" | "onChange"> & {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
};

export function AuthField({
  id,
  label,
  value,
  onValueChange,
  error,
  type = "text",
  className,
  ...props
}: AuthFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const errorId = `${id}-error`;

  return (
    <Field data-invalid={error ? true : undefined} className="gap-1.5">
      <FieldLabel htmlFor={id} className="text-[13px] font-semibold text-ink-900">
        {label}
      </FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={isPassword && showPassword ? "text" : type}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-[42px] rounded-md bg-white px-3 text-sm text-ink-900 aria-invalid:bg-error-soft",
            isPassword && "pr-10",
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-ink-500 outline-none hover:text-ink-700 focus-visible:text-ink-900"
          >
            {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        )}
      </div>
      {error && (
        <FieldError id={errorId} className="text-xs text-error">
          {error}
        </FieldError>
      )}
    </Field>
  );
}
