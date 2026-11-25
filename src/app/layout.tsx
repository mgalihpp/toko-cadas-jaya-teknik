import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCReactProvider } from "@/trpc/client";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Cadas Jaya Teknik",
  description: "Toko alat teknik: katalog produk dan pemesanan online",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A4F86",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${roboto.variable} h-full antialiased`}>
      <body className="min-h-full">
        <TRPCReactProvider>
          <TooltipProvider>
            <div className="relative mx-auto flex min-h-svh w-full max-w-[430px] flex-col bg-ink-50 shadow-[0_0_40px_rgba(10,40,70,.12)]">
              {children}
            </div>
          </TooltipProvider>
          <Toaster />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
