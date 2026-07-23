import { NextResponse } from "next/server";
import { listAllEvents, upsertEvent, deleteEvent, type EventRecord } from "../../../lib/events";
import { isSupabaseConfigured } from "../../../lib/supabase";

export const runtime = "nodejs";

function authed(request: Request): boolean {
  const admin = process.env.ADMIN_TOKEN;
  if (!admin) return false;
  const url = new URL(request.url);
  const provided = request.headers.get("x-admin-token") || url.searchParams.get("token") || "";
  return provided === admin;
}

function guard(request: Request): NextResponse | null {
  if (!process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "ADMIN_TOKEN is not set on the server." }, { status: 500 });
  }
  if (!authed(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase isn't configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in Vercel." },
      { status: 503 }
    );
  }
  return null;
}

/** List all events (drafts included) for the CMS. */
export async function GET(request: Request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const events = await listAllEvents();
  return NextResponse.json({ ok: true, events });
}

/** Create/update ({ event }) or delete ({ deleteId }) an event. */
export async function POST(request: Request) {
  const blocked = guard(request);
  if (blocked) return blocked;

  let body: { event?: Partial<EventRecord>; deleteId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.deleteId) {
    const res = await deleteEvent(body.deleteId);
    return res.ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: res.error }, { status: 500 });
  }

  const event = body.event;
  if (!event || !event.title?.trim() || !event.slug?.trim()) {
    return NextResponse.json({ error: "Title and slug are required." }, { status: 400 });
  }

  const res = await upsertEvent(event);
  return res.ok
    ? NextResponse.json({ ok: true, event: res.event })
    : NextResponse.json({ error: res.error }, { status: 500 });
}
