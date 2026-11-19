"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBagIcon } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { authErrorMessage } from "../lib";
import { fieldErrorsOf, loginSchema, type FieldErrors, type LoginInput } from "../schemas";
import { AuthField } from "./auth-field";
import { AuthHeading } from "./auth-shell";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [values, setValues] = useState<LoginInput>({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<FieldErrors<LoginInput>>({});
  const [pending, setPending] = useState(false);
  const toCheckout = next.startsWith("/checkout");

  function setField(field: keyof LoginInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrorsOf(parsed.error));
      return;
    }

    setPending(true);
    const { data, error } = await authClient.signIn.email({ ...parsed.data, rememberMe });
    if (error) {
      setPending(false);
      toast.error(authErrorMessage(error));
      return;
    }

    toast.success(`Selamat datang, ${data.user.name}`);
    router.replace(data.user.role === "admin" ? "/admin" : next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <AuthHeading
        title="Masuk"
        subtitle={toCheckout ? "Masuk untuk lanjut ke checkout" : "Masuk untuk melanjutkan belanja"}
      />

      {toCheckout && (
        <div className="flex items-center gap-2.5 rounded-[10px] border border-info-border bg-info-soft px-3.5 py-3 text-[13px] font-medium text-info">
          <ShoppingBagIcon className="size-4 shrink-0" aria-hidden />
          Produk di keranjangmu tetap tersimpan
        </div>
      )}

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
        id="password"
        label="Kata sandi"
        type="password"
        autoComplete="current-password"
        placeholder="Masukkan kata sandi"
        value={values.password}
        onValueChange={(value) => setField("password", value)}
        error={errors.password}
        disabled={pending}
      />

      <div className="flex items-center gap-2">
        <Checkbox
          id="remember"
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(checked === true)}
          disabled={pending}
          className="size-[18px] rounded-[5px]"
        />
        <Label htmlFor="remember" className="text-[13px] font-normal text-ink-600">
          Ingat saya
        </Label>
      </div>

      <Button type="submit" disabled={pending} className="h-12 w-full text-sm font-semibold">
        {pending && <Spinner />}
        {pending ? "Memproses..." : "Masuk"}
      </Button>

      <p className="text-center text-sm text-ink-600">
        Belum punya akun?{" "}
        <Link
          href={next === "/" ? "/daftar" : `/daftar?next=${encodeURIComponent(next)}`}
          className="font-semibold text-brand-700 hover:underline"
        >
          Daftar
        </Link>
      </p>
    </form>
  );
}
