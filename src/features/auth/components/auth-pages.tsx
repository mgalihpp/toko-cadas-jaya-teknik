import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { safeNextPath } from "../lib";
import { redirectIfAdmin, redirectIfSignedIn } from "../session";
import { AdminLoginForm } from "./admin-login-form";
import { AuthShell } from "./auth-shell";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <AuthShell>
      <Suspense fallback={<FormSkeleton fields={2} />}>
        <LoginGate searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

export function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <AuthShell>
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
    <div className="flex flex-col gap-3.5 px-4 py-5" aria-busy="true" aria-label="Memuat formulir">
      <Skeleton className="h-11 w-full rounded-xl" />
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-12 w-full rounded-[10px]" />
        </div>
      ))}
      <Skeleton className="h-[50px] w-full rounded-[10px]" />
    </div>
  );
}
