import type { Metadata } from "next";
import NewsletterComposer from "./NewsletterComposer";

export const metadata: Metadata = {
  title: "Newsletter Composer — The Thinking Room",
  robots: { index: false, follow: false },
};

export default function NewsletterPage() {
  return <NewsletterComposer />;
}
