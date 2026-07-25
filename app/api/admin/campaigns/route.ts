import { NextResponse } from "next/server";
import { listCampaigns, cancelCampaign } from "../../../lib/campaigns";
import { isSupabaseConfigured } from "../../../lib/supabase";

export const runtime = "nodejs";

function guard(request: Request): NextResponse | null {
  const admin = process.env.ADMIN_TOKEN;
  if (!admin) return NextResponse.json({ error: "ADMIN_TOKEN is not set." }, { status: 500 });
  if ((request.headers.get("x-admin-token") || "") !== admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, campaigns: [], supabase: false });
  }
  return null;
}

export async function GET(request: Request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  return NextResponse.json({ ok: true, campaigns: await listCampaigns(), supabase: true });
}

export async function POST(request: Request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const body = await request.json().catch(() => ({}));
  if (!body.cancelId) return NextResponse.json({ error: "Nothing to do." }, { status: 400 });
  const res = await cancelCampaign(body.cancelId);
  return res.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: res.error }, { status: 500 });
}
