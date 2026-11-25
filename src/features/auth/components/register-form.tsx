"use client";

import { LockIcon, MailIcon, PhoneIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { MButton } from "@/components/mobile/m-button";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "../lib";
import { fieldErrorsOf, registerSchema, type FieldErrors, type RegisterInput } from "../schemas";
import { AuthField } from "./auth-field";
import { AuthFootnote, AuthTabs } from "./auth-shell";

const EMPTY: RegisterInput = { name: "", email: "", phone: "", password: "" };

export function RegisterForm({ next }: { next: string }) {
  const router = useRouter();
  const [values, setValues] = useState<RegisterInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<RegisterInput>>({});
  const [pending, setPending] = useState(false);

  function setField(field: keyof RegisterInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrorsOf(parsed.error));
      return;
    }
    setPending(true);
    const { error } = await authClient.signUp.email(parsed.data);
    if (error) {
      setPending(false);
      const message = authErrorMessage(error);
      if (error.code?.startsWith("USER_ALREADY_EXISTS")) setErrors({ email: message });
      toast.error(message);
      return;
    }
    toast.success("Akun berhasil dibuat");
    router.replace(next);
    router.refresh();
  }

  return (
    <>
      <AuthTabs active="daftar" next={next} />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5 px-4 py-5">
        <AuthField
          id="name"
          label="Nama lengkap"
          icon={UserIcon}
          autoComplete="name"
          placeholder="Nama sesuai identitas"
          value={values.name}
          onValueChange={(value) => setField("name", value)}
          error={errors.name}
          disabled={pending}
        />
        <AuthField
          id="phone"
          label="Nomor telepon"
          icon={PhoneIcon}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="0812 3456 7890"
          value={values.phone}
          onValueChange={(value) => setField("phone", value)}
          error={errors.phone}
          disabled={pending}
        />
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
          disabled={pending}
        />
        <AuthField
          id="password"
          label="Kata sandi"
          icon={LockIcon}
          type="password"
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          value={values.password}
          onValueChange={(value) => setField("password", value)}
          error={errors.password}
          hint="Minimal 8 karakter"
          disabled={pending}
        />
        <MButton type="submit" size="lg" block loading={pending}>
          {pending ? "Membuat akun…" : "Buat akun"}
        </MButton>
        <AuthFootnote />
      </form>
    </>
  );
}
