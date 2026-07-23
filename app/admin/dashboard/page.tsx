import type { Metadata } from "next";
import Dashboard from "./Dashboard";

export const metadata: Metadata = {
  title: "Dashboard — The Thinking Room",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <Dashboard />;
}
