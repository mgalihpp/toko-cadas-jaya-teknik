import type { Metadata } from "next";
import { RegisterPage } from "@/features/auth/server";

export const metadata: Metadata = { title: "Daftar | Cadas Jaya Teknik" };

export default function Page({ searchParams }: PageProps<"/daftar">) {
  return <RegisterPage searchParams={searchParams} />;
}
