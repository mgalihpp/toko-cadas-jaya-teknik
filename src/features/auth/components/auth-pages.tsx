import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { safeNextPath } from "../lib";
import { redirectIfAdmin, redirectIfSignedIn } from "../session";
import { AdminLoginForm } from "./admin-login-form";
import { AuthShell } from "./auth-shell";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const LOGIN_IMAGE =
  "https://images.unsplash.com/photo-1569783899817-a49d2d25287c?auto=format&fit=crop&w=1080&q=80";
const REGISTER_IMAGE =
  "https://images.unsplash.com/photo-1563439633552-1d4b7be86090?auto=format&fit=crop&w=1080&q=80";

export function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <AuthShell
      imageUrl={LOGIN_IMAGE}
      quote="Pesan alat hari ini, pantau statusnya sampai barang di tanganmu."
    >
      <Suspense fallback={<FormSkeleton fields={2} />}>
        <LoginGate searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

export function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <AuthShell
      imageUrl={REGISTER_IMAGE}
      quote="Satu akun untuk menyimpan keranjang, riwayat pesanan, dan bukti bayar."
    >
      <Suspense fallback={<FormSkeleton fields={4} />}>
        <RegisterGate searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

export function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginGate />
    </Suspense>
  );
}

async function LoginGate({ searchParams }: { searchParams: SearchParams }) {
  const next = safeNextPath((await searchParams).next);
  await redirectIfSignedIn(next);
  return <LoginForm next={next} />;
}

async function RegisterGate({ searchParams }: { searchParams: SearchParams }) {
  const next = safeNextPath((await searchParams).next);
  await redirectIfSignedIn(next);
  return <RegisterForm next={next} />;
}

async function AdminLoginGate() {
  await redirectIfAdmin();
  return <AdminLoginForm />;
}

function FormSkeleton({ fields }: { fields: number }) {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Memuat formulir">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-[42px] w-full" />
        </div>
      ))}
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
