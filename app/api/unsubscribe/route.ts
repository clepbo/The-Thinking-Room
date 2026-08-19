import { NextResponse } from "next/server";
import { addUnsubscribe } from "../../lib/unsubscribe";
import { isSupabaseConfigured } from "../../lib/supabase";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Public. Called by the /unsubscribe page's Confirm button (a POST, so link
 * prefetchers/scanners doing GET can't unsubscribe anyone by accident).
 */
export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const email = (body.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    // Nothing to write to yet — but don't error the user; log it.
    console.log("[unsubscribe] Supabase not configured — would unsubscribe:", email);
    return NextResponse.json({ ok: true });
  }
  const res = await addUnsubscribe(email);
  return res.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: res.error }, { status: 500 });
}
