export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-svh flex-1 flex-col bg-white">{children}</div>;
}
