import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RefreshUserOnLoad from "@/components/auth/RefreshUserOnLoad";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jester.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Jester – Livrări și comenzi Sulina",
    template: "%s | Jester",
  },
  description:
    "Jester – livrări și comenzi în Sulina. Jester 24/24, meniu, pizza, delivery. Comandă online sau sună.",
  keywords: ["Jester", "Sulina", "livrări", "comenzi", "food", "delivery", "pizza"],
  authors: [{ name: "Jester" }],
  openGraph: {
    type: "website",
    locale: "ro_RO",
    url: siteUrl,
    siteName: "Jester",
    title: "Jester – Livrări și comenzi Sulina",
    description: "Jester – livrări și comenzi în Sulina. Jester 24/24, meniu, pizza, delivery.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jester – Livrări și comenzi Sulina",
    description: "Jester – livrări și comenzi în Sulina. Jester 24/24, meniu, pizza, delivery.",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RefreshUserOnLoad />
        {children}
      </body>
    </html>
  );
}
