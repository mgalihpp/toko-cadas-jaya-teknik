import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export async function redirectIfSignedIn(next: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;
  redirect(session.user.role === "admin" ? "/admin" : next);
}

export async function redirectIfAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role === "admin") redirect("/admin");
}
