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
    // A tiny inline "doorway + light" favicon matching the logo mark.
    icon: [
      {
        url:
          "data:image/svg+xml," +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#0b0806"/><path d="M8 26 V14.8 a8 8 0 0 1 16 0 V26" fill="none" stroke="#e0913f" stroke-width="2.2" stroke-linejoin="round"/><path d="M6 26 H26" stroke="#e0913f" stroke-width="2.2" stroke-linecap="round"/><rect x="14.9" y="10.5" width="2.4" height="14" rx="1.2" fill="#ffd38a"/></svg>`
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
