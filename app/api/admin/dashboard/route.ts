import { NextResponse } from "next/server";
import { fetchSheetRegistrants } from "../../../lib/sheet";
import { listAllEvents } from "../../../lib/events";
import { isSupabaseConfigured } from "../../../lib/supabase";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: Request) {
  const admin = process.env.ADMIN_TOKEN;
  if (!admin) return NextResponse.json({ error: "ADMIN_TOKEN is not set." }, { status: 500 });
  const provided = request.headers.get("x-admin-token") || new URL(request.url).searchParams.get("token") || "";
  if (provided !== admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  // ---- Audience stats from the Google Sheet ----
  const rows = await fetchSheetRegistrants();
  let contacts: null | {
    total: number;
    event: number;
    journal: number;
    reminded: number;
  } = null;
  if (rows) {
    const seen = new Set<string>();
    let event = 0;
    let journal = 0;
    let reminded = 0;
    for (const r of rows) {
      const email = String(r.email || "").trim().toLowerCase();
      if (!EMAIL_RE.test(email) || seen.has(email)) continue;
      seen.add(email);
      if (String(r.type || "").toLowerCase().includes("journal")) journal++;
      else event++;
      if (r.remindedAt) reminded++;
    }
    contacts = { total: seen.size, event, journal, reminded };
  }

  // ---- Event stats from Supabase ----
  let events: null | { total: number; published: number; drafts: number } = null;
  if (isSupabaseConfigured()) {
    const all = await listAllEvents();
    const published = all.filter((e) => e.status === "published").length;
    events = { total: all.length, published, drafts: all.length - published };
  }

  return NextResponse.json({
    ok: true,
    sheetConfigured: rows !== null,
    supabaseConfigured: isSupabaseConfigured(),
    contacts,
    events,
  });
}
