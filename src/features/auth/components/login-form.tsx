"use client";

import { LockIcon, MailIcon, ShoppingCartIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { MButton } from "@/components/mobile/m-button";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "../lib";
import { fieldErrorsOf, loginSchema, type FieldErrors, type LoginInput } from "../schemas";
import { AuthField } from "./auth-field";
import { AuthBanner, AuthFootnote, AuthTabs } from "./auth-shell";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [values, setValues] = useState<LoginInput>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors<LoginInput>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const toCheckout = next.startsWith("/checkout");

  function setField(field: keyof LoginInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
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
    const { data, error } = await authClient.signIn.email({ ...parsed.data, rememberMe: true });
    if (error) {
      setPending(false);
      setFormError(authErrorMessage(error));
      return;
    }
    toast.success(`Selamat datang, ${data.user.name}`);
    router.replace(data.user.role === "admin" ? "/admin" : next);
    router.refresh();
  }

  return (
    <>
      <AuthTabs active="masuk" next={next} />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5 px-4 py-5">
        {formError ? (
          <AuthBanner tone="error" title="Gagal masuk">
            {formError}
          </AuthBanner>
        ) : toCheckout ? (
          <AuthBanner tone="info" icon={ShoppingCartIcon}>
            Masuk dulu untuk lanjut checkout. Isi keranjangmu tetap tersimpan.
          </AuthBanner>
        ) : null}
        <AuthField
          id="email"
          label="Email"
          icon={MailIcon}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="nama@email.com"
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
        <button
          type="button"
          onClick={() => toast.info("Hubungi Owner toko untuk mengatur ulang kata sandi.")}
          className="self-end text-[13px] font-bold text-brand-600"
        >
          Lupa kata sandi?
        </button>
        <MButton type="submit" size="lg" block loading={pending}>
          {pending ? "Memproses…" : "Masuk"}
        </MButton>
        <AuthFootnote />
      </form>
    </>
  );
}
