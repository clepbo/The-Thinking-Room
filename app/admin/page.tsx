import type { Metadata } from "next";
import AdminConsole from "./AdminConsole";

// Keep this console out of search engines. It's still reachable by URL, but
// every privileged action requires the admin token, checked server-side.
export const metadata: Metadata = {
  title: "Reminder Console — The Thinking Room",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminConsole />;
}
