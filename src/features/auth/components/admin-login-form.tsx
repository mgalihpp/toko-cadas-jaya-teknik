"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleXIcon, CogIcon, LockIcon } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authErrorMessage } from "../lib";
import { fieldErrorsOf, loginSchema, type FieldErrors, type LoginInput } from "../schemas";
import { AuthField } from "./auth-field";

const NOT_ADMIN = "Akun ini tidak punya akses ke panel admin.";

export function AdminLoginForm() {
  const router = useRouter();
  const [values, setValues] = useState<LoginInput>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors<LoginInput>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function setField(field: keyof LoginInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function fail(message: string) {
    setPending(false);
    setFormError(message);
    toast.error(message);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrorsOf(parsed.error));
      return;
    }

    setPending(true);
    const { data, error } = await authClient.signIn.email(parsed.data);
    if (error) return fail(authErrorMessage(error));

    if (data.user.role !== "admin") {
      await authClient.signOut();
      return fail(NOT_ADMIN);
    }

    toast.success("Berhasil masuk ke panel");
    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-svh flex-1 items-center justify-center bg-surface px-4 py-10">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex w-full max-w-[420px] flex-col gap-6 rounded-2xl border border-ink-200 bg-white p-6 shadow-[0_8px_32px_rgba(28,25,23,0.06)] sm:p-[39px] [&_label]:leading-4"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-600 text-white">
            <CogIcon className="size-[22px]" aria-hidden />
          </span>
          <div className="flex flex-col">
            <span className="font-heading text-[17px] leading-[22px] font-bold text-ink-900">Cadas Jaya Teknik</span>
            <span className="text-xs leading-[15px] text-ink-500">Panel Owner</span>
          </div>
        </div>

        <h1 className="font-heading text-[28px] leading-9 font-bold tracking-[-0.6px] text-ink-900">Masuk ke panel</h1>

        {formError && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-[10px] border border-error-border bg-error-soft p-3 text-[13px] font-medium text-error"
          >
            <CircleXIcon className="size-4 shrink-0" aria-hidden />
            {formError}
          </div>
        )}

        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="username"
          inputMode="email"
          placeholder="owner@cadasjayateknik.com"
          value={values.email}
          onValueChange={(value) => setField("email", value)}
          error={errors.email}
          className="aria-invalid:bg-white"
          disabled={pending}
        />
        <AuthField
          id="password"
          label="Kata sandi"
          type="password"
          autoComplete="current-password"
          placeholder="Masukkan kata sandi"
          value={values.password}
          onValueChange={(value) => setField("password", value)}
          error={errors.password}
          aria-invalid={errors.password || formError ? true : undefined}
          className="aria-invalid:bg-white"
          disabled={pending}
        />

        <Button
          type="submit"
          disabled={pending}
          className="h-[46px] w-full rounded-md bg-ink-900 text-sm font-semibold text-white hover:bg-ink-800"
        >
          {pending && <Spinner />}
          {pending ? "Memproses..." : "Masuk"}
        </Button>

        <p className="flex items-center justify-center gap-2 text-xs text-ink-500">
          <LockIcon className="size-3.5" aria-hidden />
          Khusus Admin dan Owner
        </p>
      </form>
    </div>
  );
}
