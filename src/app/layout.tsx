import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TabNav from "@/components/common/TabNav";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { ClinicTimezoneProvider } from "@/contexts/ClinicTimezoneContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from "@/providers/QueryProvider";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastContainer } from "@/components/common/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Healthcare Management System",
  description: "Appointment and physiotherapy treatment management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body
        className={`${inter.variable} flex min-h-dvh flex-col antialiased bg-[color:var(--background)] text-[color:var(--foreground)]`}
      >
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              <ClinicTimezoneProvider>
                <TopNavigation />
                <TabNav />
                <main className="mx-auto min-h-0 w-full max-w-[1200px] flex-1 px-3 py-4 sm:px-4">
                  {children}
                </main>
                <ToastContainer />
              </ClinicTimezoneProvider>
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
