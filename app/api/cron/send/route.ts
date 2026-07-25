import { NextResponse } from "next/server";
import { processDueCampaigns } from "../../../lib/campaigns";
import { isSupabaseConfigured } from "../../../lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Sends any scheduled campaigns that are due, in batches. Call this on a
 * schedule (every ~5 min):
 *   - Vercel Pro: add it to vercel.json crons.
 *   - Vercel Hobby (cron is daily-only): use a free external pinger
 *     (e.g. cron-job.org) hitting this URL with the CRON_SECRET.
 * The admin "Run due sends now" button also calls this.
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>` or the admin token header.
 */
function authorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") || "";
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  const admin = process.env.ADMIN_TOKEN;
  if (admin && request.headers.get("x-admin-token") === admin) return true;
  return !cronSecret && auth.startsWith("Bearer ");
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, skipped: "Supabase not configured" });
  }
  const result = await processDueCampaigns();
  return NextResponse.json({ ok: true, ...result });
}
