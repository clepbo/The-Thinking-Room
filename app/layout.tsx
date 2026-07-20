import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import { site } from "./content";
import "./globals.css";

// Massive condensed display face for the poster-style headlines.
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display-next",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans-next",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${site.brand.name} — ${site.brand.tagline}`,
  description: site.hero.description,
  openGraph: {
    title: `${site.brand.name} — ${site.brand.tagline}`,
    description: site.hero.description,
    type: "website",
  },
  // Favicon comes from app/favicon.ico, app/icon.png, and app/apple-icon.png —
  // Next.js picks these up automatically by filename, no config needed here.
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${anton.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
