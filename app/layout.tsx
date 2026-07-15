import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { site } from "./content";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
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
  icons: {
    // A tiny inline gold "TR" favicon so there's no missing-icon flash.
    icon: [
      {
        url:
          "data:image/svg+xml," +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0c0a07"/><text x="16" y="22" font-family="Georgia,serif" font-size="15" font-weight="700" fill="#d4af6a" text-anchor="middle">TR</text></svg>`
          ),
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
