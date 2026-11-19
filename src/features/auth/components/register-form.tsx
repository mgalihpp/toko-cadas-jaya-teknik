"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authErrorMessage } from "../lib";
import {
  fieldErrorsOf,
  registerSchema,
  type FieldErrors,
  type RegisterInput,
} from "../schemas";
import { AuthField } from "./auth-field";
import { AuthHeading } from "./auth-shell";
import { PasswordStrength } from "./password-strength";

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
      if (error.code?.startsWith("USER_ALREADY_EXISTS")) {
        setErrors({ email: message });
      }
      toast.error(message);
      return;
    }

    toast.success("Akun berhasil dibuat");
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <AuthHeading title="Buat akun" subtitle="Gratis, kurang dari satu menit" />

      <AuthField
        id="name"
        label="Nama lengkap"
        autoComplete="name"
        placeholder="Nama sesuai identitas"
        value={values.name}
        onValueChange={(value) => setField("name", value)}
        error={errors.name}
        disabled={pending}
      />
      <AuthField
        id="email"
        label="Email"
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
        id="phone"
        label="Nomor telepon"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        placeholder="0813 1122 3344"
        value={values.phone}
        onValueChange={(value) => setField("phone", value)}
        error={errors.phone}
        disabled={pending}
      />
      <AuthField
        id="password"
        label="Kata sandi"
        type="password"
        autoComplete="new-password"
        placeholder="Minimal 8 karakter"
        value={values.password}
        onValueChange={(value) => setField("password", value)}
        error={errors.password}
        disabled={pending}
      />
      {!errors.password && <PasswordStrength password={values.password} />}

      <Button type="submit" disabled={pending} className="h-12 w-full text-sm font-semibold">
        {pending && <Spinner />}
        {pending ? "Membuat akun..." : "Daftar"}
      </Button>

      <p className="text-center text-sm text-ink-600">
        Sudah punya akun?{" "}
        <Link
          href={next === "/" ? "/masuk" : `/masuk?next=${encodeURIComponent(next)}`}
          className="font-semibold text-brand-700 hover:underline"
        >
          Masuk
        </Link>
      </p>
    </form>
  );
}
