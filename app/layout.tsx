import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // <--- ЦЕЙ РЯДОК ОБОВ'ЯЗКОВИЙ

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Geopolitical Dashboard",
  description: "Tracking war scenarios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}