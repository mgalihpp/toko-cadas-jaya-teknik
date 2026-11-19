import type { Metadata } from "next";
import { LoginPage } from "@/features/auth/server";

export const metadata: Metadata = { title: "Masuk | Cadas Jaya Teknik" };

export default function Page({ searchParams }: PageProps<"/masuk">) {
  return <LoginPage searchParams={searchParams} />;
}
