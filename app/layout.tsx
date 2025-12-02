import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "PeaceDeal Monitor | Analytics",
  description: "Моніторинг сценаріїв завершення війни в Україні. Аналіз відкритих джерел (OSINT) на основі сценарного моделювання.",
  openGraph: {
    title: "PeaceDeal Monitor",
    description: "Моніторинг сценаріїв завершення війни. Аналіз відкритих джерел.",
    url: "https://peace-deal-dashboard.netlify.app",
    siteName: "PeaceDeal Analytics",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PeaceDeal Analytics Dashboard',
      },
    ],
    locale: "uk_UA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PeaceDeal Monitor",
    description: "Live war scenario probability tracker.",
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className="dark">
      <body className={`${inter.variable} ${mono.variable} font-sans bg-slate-950 text-slate-200 antialiased`}>
        {children}
      </body>
    </html>
  );
}