import { getSupabase } from "./supabase";
import { getTransporter, personalize, type Recipient } from "./eventEmail";
import { fetchSheetRegistrants } from "./sheet";
import { getUnsubscribedSet } from "./unsubscribe";
import { describeFetchError } from "./http";

/**
 * Scheduled newsletter campaigns. A campaign is composed in the newsletter tab
 * and queued with a send time. The cron worker (`processDueCampaigns`) picks up
 * due campaigns, snapshots the recipient list, and sends in batches across runs
 * — so even large lists complete without hitting a serverless timeout.
 */

export type Audience = "event" | "journal" | "all";

export interface CampaignSummary {
  id: string;
  subject: string;
  audience: Audience;
  scheduled_at: string;
  status: string;
  total: number;
  sent_count: number;
  failed_count: number;
  opened_count: number;
  clicked_count: number;
  created_at: string;
}

const TABLE = "scheduled_campaigns";
const BATCH = 20; // recipients per batch
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Absolute site URL for tracking links/pixels (needed since the worker has no request). */
function siteBase(): string {
  const raw =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  return raw.replace(/\/$/, "");
}

/**
 * Fill the {{unsubscribeUrl}} placeholder, add a tracking pixel, and rewrite
 * http links through the click tracker (skipping the unsubscribe + track links).
 */
function injectTracking(html: string, campaignId: string, email: string): string {
  const base = siteBase();
  const e = encodeURIComponent(email);
  const unsub = base ? `${base}/unsubscribe?e=${e}` : "mailto:hello@thethinkingroom.co?subject=Unsubscribe";
  let out = html.replace(/\{\{\s*unsubscribeUrl\s*\}\}/gi, unsub);

  if (!base) return out; // no tracking until SITE_URL is set (unsubscribe still filled)

  out = out.replace(/href="(https?:\/\/[^"]+)"/gi, (_m, url: string) => {
    if (url.includes("/unsubscribe") || url.includes("/api/track")) return `href="${url}"`;
    return `href="${base}/api/track/click?c=${campaignId}&e=${e}&u=${encodeURIComponent(url)}"`;
  });
  const pixel = `<img src="${base}/api/track/open?c=${campaignId}&e=${e}" width="1" height="1" alt="" style="display:block;border:0;max-height:0;overflow:hidden" />`;
  out = out.includes("</body>") ? out.replace("</body>", `${pixel}</body>`) : out + pixel;
  return out;
}

/** Record a unique open/click event and bump the campaign counter. */
export async function recordEvent(
  campaignId: string,
  email: string,
  type: "open" | "click",
  url?: string
): Promise<void> {
  const db = getSupabase();
  if (!db || !campaignId || !email) return;
  const { error } = await db
    .from("email_events")
    .insert({ campaign_id: campaignId, email: email.toLowerCase(), type, url: url || null });
  if (error) {
    if (error.code === "23505") return; // already counted (unique)
    console.error("[track] insert failed:", error.message);
    return;
  }
  await db.rpc("bump_campaign", { cid: campaignId, col: type === "open" ? "opened" : "clicked" });
}

/** Queue a campaign to send at `scheduledAt`. If `recipients` is provided, that
 *  exact list is used; otherwise the worker snapshots the `audience` at send time. */
export async function createScheduledCampaign(input: {
  subject: string;
  html: string;
  bodyText?: string;
  audience: Audience;
  scheduledAt: string;
  recipients?: Recipient[];
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const db = getSupabase();
  if (!db) return { ok: false, error: "Supabase is not configured." };
  const hasExplicit = Array.isArray(input.recipients) && input.recipients.length > 0;
  try {
    const { data, error } = await db
      .from(TABLE)
      .insert({
        subject: input.subject,
        html: input.html,
        body_text: input.bodyText || "",
        audience: input.audience,
        scheduled_at: input.scheduledAt,
        status: "scheduled",
        recipients: hasExplicit ? input.recipients : null,
        total: hasExplicit ? input.recipients!.length : 0,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data.id as string };
  } catch (err) {
    // Network-level failure reaching Supabase (undici "fetch failed") — surface
    // the real cause instead of the opaque wrapper.
    return { ok: false, error: `Couldn't reach Supabase: ${describeFetchError(err)}` };
  }
}

/** List recent + upcoming campaigns for the dashboard (no heavy fields). */
export async function listCampaigns(): Promise<CampaignSummary[]> {
  const db = getSupabase();
  if (!db) return [];
  const { data, error } = await db
    .from(TABLE)
    .select("id, subject, audience, scheduled_at, status, total, sent_count, failed_count, opened_count, clicked_count, created_at")
    .order("scheduled_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error("[campaigns] list failed:", error.message);
    return [];
  }
  return (data as CampaignSummary[]) || [];
}

/** Full campaign incl. the list of failed recipients (for the dashboard). */
export async function getCampaignDetail(id: string): Promise<{
  id: string;
  subject: string;
  failures: { email: string; error: string }[];
} | null> {
  const db = getSupabase();
  if (!db) return null;
  const { data, error } = await db.from(TABLE).select("id, subject, failures").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return { id: data.id, subject: data.subject, failures: Array.isArray(data.failures) ? data.failures : [] };
}

export async function cancelCampaign(id: string): Promise<{ ok: boolean; error?: string }> {
  const db = getSupabase();
  if (!db) return { ok: false, error: "Supabase is not configured." };
  const { error } = await db
    .from(TABLE)
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["scheduled", "sending"]);
  return error ? { ok: false, error: error.message } : { ok: true };
}

function filterAudience(rows: { email?: string; name?: string; type?: string }[], audience: Audience): Recipient[] {
  const seen = new Set<string>();
  const out: Recipient[] = [];
  for (const r of rows) {
    const email = String(r.email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email) || seen.has(email)) continue;
    const isJournal = String(r.type || "").toLowerCase().includes("journal");
    if (audience === "event" && isJournal) continue;
    if (audience === "journal" && !isJournal) continue;
    seen.add(email);
    out.push({ email, name: String(r.name || "") });
  }
  return out;
}

/**
 * The cron worker. Sends due campaigns in batches until the time budget runs
 * out (default 40s, under the 60s function limit). Called by /api/cron/send.
 */
export async function processDueCampaigns(budgetMs = 40_000): Promise<{
  ran: boolean;
  error?: string;
  results: { id: string; sent: number; failed: number; done: boolean }[];
}> {
  const db = getSupabase();
  if (!db) return { ran: false, error: "Supabase not configured", results: [] };
  const transporter = getTransporter();
  if (!transporter) return { ran: false, error: "GMAIL not configured", results: [] };

  const start = Date.now();
  const results: { id: string; sent: number; failed: number; done: boolean }[] = [];

  try {
    await runDueCampaigns(db, transporter, start, budgetMs, results);
  } catch (err) {
    // A Supabase network failure (undici "fetch failed") throws here rather than
    // returning a query error. Report the real cause; work already committed to
    // the DB (cursor/sent counts) is preserved for the next run.
    return { ran: results.length > 0, error: `Couldn't reach Supabase: ${describeFetchError(err)}`, results };
  }

  return { ran: true, results };
}

async function runDueCampaigns(
  db: NonNullable<ReturnType<typeof getSupabase>>,
  transporter: NonNullable<ReturnType<typeof getTransporter>>,
  start: number,
  budgetMs: number,
  results: { id: string; sent: number; failed: number; done: boolean }[]
): Promise<void> {
  while (Date.now() - start < budgetMs) {
    const { data: due } = await db
      .from(TABLE)
      .select("*")
      .in("status", ["scheduled", "sending"])
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(1);
    const c = due?.[0];
    if (!c) break;

    // First pickup: flip to "sending". Keep an explicit recipient list if one
    // was provided at schedule time; otherwise snapshot the audience now.
    let recipients: Recipient[] = c.recipients || [];
    if (c.status === "scheduled") {
      if (recipients.length === 0) {
        const rows = await fetchSheetRegistrants();
        recipients = rows ? filterAudience(rows, c.audience) : [];
      }
      // Never email anyone who has unsubscribed.
      const unsub = await getUnsubscribedSet();
      if (unsub.size) recipients = recipients.filter((r) => !unsub.has(r.email.toLowerCase()));
      await db
        .from(TABLE)
        .update({
          status: "sending",
          recipients,
          total: recipients.length,
          cursor: 0,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", c.id);
      c.cursor = 0;
      c.sent_count = 0;
      c.failed_count = 0;
    }

    if (recipients.length === 0) {
      await db.from(TABLE).update({ status: "sent", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", c.id);
      results.push({ id: c.id, sent: 0, failed: 0, done: true });
      continue;
    }

    let cursor = c.cursor || 0;
    let sent = c.sent_count || 0;
    let failed = c.failed_count || 0;
    const failures: { email: string; error: string }[] = Array.isArray(c.failures) ? c.failures : [];

    while (cursor < recipients.length && Date.now() - start < budgetMs) {
      const batch = recipients.slice(cursor, cursor + BATCH);
      for (const r of batch) {
        try {
          await transporter.sendMail({
            from: `"The Thinking Room" <${process.env.GMAIL_USER}>`,
            to: r.email,
            subject: personalize(c.subject, r),
            html: injectTracking(personalize(c.html, r), c.id, r.email),
            text: personalize(c.body_text || "", r),
          });
          sent++;
        } catch (err) {
          failed++;
          failures.push({ email: r.email, error: String(err instanceof Error ? err.message : err).slice(0, 300) });
        }
      }
      cursor += batch.length;
      await db.from(TABLE).update({ cursor, sent_count: sent, failed_count: failed, failures, updated_at: new Date().toISOString() }).eq("id", c.id);
    }

    if (cursor >= recipients.length) {
      await db.from(TABLE).update({ status: "sent", cursor, sent_count: sent, failed_count: failed, failures, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", c.id);
      results.push({ id: c.id, sent, failed, done: true });
    } else {
      results.push({ id: c.id, sent, failed, done: false });
      break; // out of time budget; a later run continues from `cursor`
    }
  }
}
