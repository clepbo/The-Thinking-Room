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
  icons: {
    // A tiny inline amber "TR" favicon so there's no missing-icon flash.
    icon: [
      {
        url:
          "data:image/svg+xml," +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0b0806"/><text x="16" y="23" font-family="Arial Black,Arial,sans-serif" font-size="16" font-weight="900" fill="#e0913f" text-anchor="middle">TR</text></svg>`
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
    <html lang="en" className={`${anton.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
