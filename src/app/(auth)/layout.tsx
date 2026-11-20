import { StoreShell } from "@/components/layout";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}
