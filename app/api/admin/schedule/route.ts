import { NextResponse } from "next/server";
import { createScheduledCampaign, type Audience } from "../../../lib/campaigns";
import { isSupabaseConfigured } from "../../../lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = process.env.ADMIN_TOKEN;
  if (!admin) return NextResponse.json({ error: "ADMIN_TOKEN is not set." }, { status: 500 });
  if ((request.headers.get("x-admin-token") || "") !== admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Scheduling needs Supabase. Set SUPABASE_URL and SUPABASE_SECRET_KEY in Vercel." },
      { status: 503 }
    );
  }

  let body: { subject?: string; html?: string; text?: string; audience?: Audience; scheduledAt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.subject?.trim()) return NextResponse.json({ error: "Add a subject line." }, { status: 400 });
  if (!body.html?.trim()) return NextResponse.json({ error: "The email has no content." }, { status: 400 });
  const when = body.scheduledAt ? new Date(body.scheduledAt) : null;
  if (!when || isNaN(when.getTime())) return NextResponse.json({ error: "Pick a valid date and time." }, { status: 400 });
  if (when.getTime() < Date.now() - 60_000) {
    return NextResponse.json({ error: "That time is in the past." }, { status: 400 });
  }

  const res = await createScheduledCampaign({
    subject: body.subject,
    html: body.html,
    bodyText: body.text || "",
    audience: (body.audience as Audience) || "all",
    scheduledAt: when.toISOString(),
  });
  return res.ok
    ? NextResponse.json({ ok: true, id: res.id })
    : NextResponse.json({ error: res.error }, { status: 500 });
}
