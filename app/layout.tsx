import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google"; // Додамо моноширинний шрифт для цифр
import "./globals.css";

// Основний шрифт
const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
// Шрифт для цифр і коду (виглядає професійно)
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "PeaceDeal AI | Geopolitical Analytics",
  description: "AI-driven forecasting of war-ending scenarios in Ukraine. Real-time probability tracking based on DIME methodology.",
  openGraph: {
    title: "PeaceDeal AI Dashboard",
    description: "Моніторинг сценаріїв завершення війни. Аналіз 24/7 на базі AI.",
    url: "https://peace-deal-dashboard.netlify.app",
    siteName: "PeaceDeal Analytics",
    locale: "uk_UA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PeaceDeal AI Analytics",
    description: "Live war scenario probability tracker.",
  },
  // Тут можна додати посилання на картинку-прев'ю, якщо вона буде
  // icons: { icon: '/favicon.ico' }
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