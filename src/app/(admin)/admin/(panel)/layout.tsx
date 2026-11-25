import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminShell } from "@/components/layout";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { Spinner } from "@/components/ui/spinner";
import { auth } from "@/server/auth";

async function AdminGate({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/masuk");
  if (session.user.role !== "admin") return <AccessDenied />;

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
        <div className="flex flex-1 items-center justify-center text-ink-500">
          <Spinner className="size-6" />
        </div>
      }
    >
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
