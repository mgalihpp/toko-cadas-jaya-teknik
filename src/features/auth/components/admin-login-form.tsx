"use client";

import { LockIcon, MailIcon, ShieldCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { MButton } from "@/components/mobile/m-button";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "../lib";
import { fieldErrorsOf, loginSchema, type FieldErrors, type LoginInput } from "../schemas";
import { AuthField } from "./auth-field";
import { AuthBanner } from "./auth-shell";

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
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-2.5 bg-gradient-to-b from-brand-900 to-brand-600 px-5 pt-14 pb-14">
        <span className="flex size-[52px] items-center justify-center rounded-[14px] bg-white">
          <ShieldCheckIcon className="size-7 text-brand-600" strokeWidth={1.8} />
        </span>
        <h1 className="text-[26px] leading-[1.35] font-bold text-white">Panel Admin</h1>
        <p className="text-sm text-[#CFE4F6]">Cadas Jaya Teknik. Khusus Owner dan pengelola toko.</p>
      </div>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative z-10 mx-4 -mt-6 flex flex-col gap-3.5 rounded-2xl bg-white p-[18px] shadow-[0_8px_24px_rgba(10,40,70,.14)]"
      >
        {formError ? (
          <AuthBanner tone="error" title="Gagal masuk">
            {formError}
          </AuthBanner>
        ) : null}
        <AuthField
          id="email"
          label="Email admin"
          icon={MailIcon}
          type="email"
          autoComplete="username"
          inputMode="email"
          placeholder="owner@cadasjaya.id"
          value={values.email}
          onValueChange={(value) => setField("email", value)}
          error={errors.email}
          invalid={Boolean(formError)}
          disabled={pending}
        />
        <AuthField
          id="password"
          label="Kata sandi"
          icon={LockIcon}
          type="password"
          autoComplete="current-password"
          placeholder="Masukkan kata sandi"
          value={values.password}
          onValueChange={(value) => setField("password", value)}
          error={errors.password}
          invalid={Boolean(formError)}
          disabled={pending}
        />
        <MButton type="submit" size="lg" block loading={pending}>
          {pending ? "Memproses…" : "Masuk ke panel"}
        </MButton>
        <p className="text-center text-xs text-ink-500">Halaman admin tidak bisa dibuka tanpa login.</p>
      </form>
    </div>
  );
}
