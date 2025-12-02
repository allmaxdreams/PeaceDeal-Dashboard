import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

// Щоб картинка працювала, тобі треба покласти файл og-image.png у папку public
// Я додав код, який посилається на неї.
export const metadata: Metadata = {
  title: "PeaceDeal.AI | War Scenarios Analytics",
  description: "AI-driven probabilistic model forecasting 6 war-ending scenarios in Ukraine. Real-time tracking via DIME methodology.",
  openGraph: {
    title: "PeaceDeal.AI Dashboard",
    description: "Моніторинг сценаріїв завершення війни. Аналіз 24/7 на базі AI.",
    url: "https://peace-deal-dashboard.netlify.app",
    siteName: "PeaceDeal Analytics",
    images: [
      {
        url: '/og-image.png', // Тобі треба додати цей файл в public!
        width: 1200,
        height: 630,
        alt: 'PeaceDeal AI Analytics Dashboard',
      },
    ],
    locale: "uk_UA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PeaceDeal AI Analytics",
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