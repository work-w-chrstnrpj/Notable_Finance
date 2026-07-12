import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { FinanceDataProvider } from "@/lib/finance-data-context";

export const metadata: Metadata = {
  title: "Notable Finance",
  description: "A Notion-backed finance encoding and viewing workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <FinanceDataProvider>{children}</FinanceDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
