import { getSupabase } from "./supabase";
import { getTransporter, personalize, type Recipient } from "./eventEmail";
import { fetchSheetRegistrants } from "./sheet";

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
  created_at: string;
}

const TABLE = "scheduled_campaigns";
const BATCH = 20; // recipients per batch
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Queue a campaign to send at `scheduledAt`. */
export async function createScheduledCampaign(input: {
  subject: string;
  html: string;
  bodyText?: string;
  audience: Audience;
  scheduledAt: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const db = getSupabase();
  if (!db) return { ok: false, error: "Supabase is not configured." };
  const { data, error } = await db
    .from(TABLE)
    .insert({
      subject: input.subject,
      html: input.html,
      body_text: input.bodyText || "",
      audience: input.audience,
      scheduled_at: input.scheduledAt,
      status: "scheduled",
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id as string };
}

/** List recent + upcoming campaigns for the dashboard (no heavy fields). */
export async function listCampaigns(): Promise<CampaignSummary[]> {
  const db = getSupabase();
  if (!db) return [];
  const { data, error } = await db
    .from(TABLE)
    .select("id, subject, audience, scheduled_at, status, total, sent_count, failed_count, created_at")
    .order("scheduled_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error("[campaigns] list failed:", error.message);
    return [];
  }
  return (data as CampaignSummary[]) || [];
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

    // First pickup: snapshot recipients and flip to "sending".
    let recipients: Recipient[] = c.recipients || [];
    if (c.status === "scheduled" || !c.recipients) {
      const rows = await fetchSheetRegistrants();
      recipients = rows ? filterAudience(rows, c.audience) : [];
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

    while (cursor < recipients.length && Date.now() - start < budgetMs) {
      const batch = recipients.slice(cursor, cursor + BATCH);
      for (const r of batch) {
        try {
          await transporter.sendMail({
            from: `"The Thinking Room" <${process.env.GMAIL_USER}>`,
            to: r.email,
            subject: personalize(c.subject, r),
            html: personalize(c.html, r),
            text: personalize(c.body_text || "", r),
          });
          sent++;
        } catch {
          failed++;
        }
      }
      cursor += batch.length;
      await db.from(TABLE).update({ cursor, sent_count: sent, failed_count: failed, updated_at: new Date().toISOString() }).eq("id", c.id);
    }

    if (cursor >= recipients.length) {
      await db.from(TABLE).update({ status: "sent", cursor, sent_count: sent, failed_count: failed, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", c.id);
      results.push({ id: c.id, sent, failed, done: true });
    } else {
      results.push({ id: c.id, sent, failed, done: false });
      break; // out of time budget; a later run continues from `cursor`
    }
  }

  return { ran: true, results };
}
