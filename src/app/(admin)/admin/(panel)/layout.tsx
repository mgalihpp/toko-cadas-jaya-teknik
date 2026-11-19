import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminShell } from "@/components/layout";
import { Spinner } from "@/components/ui/spinner";
import { auth } from "@/server/auth";

async function AdminGate({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/admin/masuk");

  return (
    <AdminShell user={{ name: session.user.name, email: session.user.email }}>
      {children}
    </AdminShell>
  );
}

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-ink-50 text-ink-500">
          <Spinner className="size-6" />
        </div>
      }
    >
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
