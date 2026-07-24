import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "../../../lib/supabase";

export const runtime = "nodejs";

const BUCKET = "media";

/**
 * Deletes expired uploads (media rows whose expires_at has passed) from Storage
 * and the table, so uploaded files never fill up space. Runs daily via the
 * Vercel Cron configured in vercel.json.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when the
 * CRON_SECRET env var is set. A manual run with the admin token also works.
 */
function authorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") || "";
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  const admin = process.env.ADMIN_TOKEN;
  if (admin && request.headers.get("x-admin-token") === admin) return true;
  // If no CRON_SECRET is configured, allow (Vercel cron only; still unlisted).
  return !cronSecret && auth.startsWith("Bearer ");
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, skipped: "Supabase not configured", deleted: 0 });
  }

  const db = getSupabase()!;
  const nowIso = new Date().toISOString();

  const { data: expired, error } = await db
    .from("media")
    .select("id, path")
    .lt("expires_at", nowIso)
    .not("expires_at", "is", null)
    .limit(1000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = expired || [];
  if (rows.length === 0) return NextResponse.json({ ok: true, deleted: 0 });

  const paths = rows.map((r) => r.path);
  const ids = rows.map((r) => r.id);

  await db.storage.from(BUCKET).remove(paths);
  await db.from("media").delete().in("id", ids);

  console.log(`[the-thinking-room] cleanup: deleted ${rows.length} expired file(s)`);
  return NextResponse.json({ ok: true, deleted: rows.length });
}
