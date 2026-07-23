import type { Metadata } from "next";
import EventsAdmin from "./EventsAdmin";

export const metadata: Metadata = {
  title: "Events CMS — The Thinking Room",
  robots: { index: false, follow: false },
};

export default function EventsAdminPage() {
  return <EventsAdmin />;
}
