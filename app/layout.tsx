import "@/styles/globals.css";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { defaultLocale } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/favicon.svg",
    shortcut: "/icons/favicon.svg",
    apple: "/icons/icon-192.svg"
  }
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang={defaultLocale} suppressHydrationWarning>
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
