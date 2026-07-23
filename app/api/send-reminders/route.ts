import { NextResponse } from "next/server";
import {
  getTransporter,
  buildReminderEmail,
  defaultReminderContent,
  personalize,
  type Recipient,
  type ReminderContent,
} from "../../lib/eventEmail";

/**
 * ============================================================================
 *  SEND A REMINDER EMAIL TO ALL REGISTRANTS  (protected admin endpoint)
 * ============================================================================
 *  POST /api/send-reminders   — token-protected. Reads the registrant list
 *  from your Google Sheet and emails each event registrant a reminder via your
 *  Gmail (the same setup the confirmation email uses).
 *
 *  REQUIRED ENV VARS (Vercel → Settings → Environment Variables):
 *    ADMIN_TOKEN        a long random secret; whoever triggers this must supply it
 *    GMAIL_USER         your Gmail address        (already set for confirmations)
 *    GMAIL_APP_PASSWORD your Gmail app password    (already set for confirmations)
 *    ZOOM_LINK          the join URL              (already set for confirmations)
 *    SHEET_WEBHOOK_URL  your Apps Script web-app URL (already set for the sheet)
 *    SHEET_API_TOKEN    must match CONFIG.API_TOKEN in your Apps Script (Code.gs)
 *  OPTIONAL:
 *    ZOOM_MEETING_ID, ZOOM_PASSCODE, REMINDER_SUBJECT
 *
 *  HOW TO CALL IT (from your computer's terminal). Pass the admin token in the
 *  `x-admin-token` header, and options in the JSON body:
 *
 *    # 1) Test — send ONE reminder to yourself:
 *    curl -X POST https://YOUR-SITE/api/send-reminders \
 *      -H "x-admin-token: YOUR_ADMIN_TOKEN" -H "Content-Type: application/json" \
 *      -d '{"test":"you@example.com"}'
 *
 *    # 2) Dry run — list who WOULD get it, send nothing:
 *    curl -X POST https://YOUR-SITE/api/send-reminders \
 *      -H "x-admin-token: YOUR_ADMIN_TOKEN" -H "Content-Type: application/json" \
 *      -d '{"dryRun":true}'
 *
 *    # 3) Send for real (skips anyone already reminded):
 *    curl -X POST https://YOUR-SITE/api/send-reminders \
 *      -H "x-admin-token: YOUR_ADMIN_TOKEN" -H "Content-Type: application/json" \
 *      -d '{}'
 *
 *  Body options (all optional): { test, dryRun, resend, recipients }
 *    test:       "email"  → send a single test to this address only
 *    dryRun:     true     → return the recipient list without sending
 *    resend:     true     → include people already marked reminded
 *    recipients: ["a@x.com", {"email":"b@y.com","name":"Bee"}]
 *                         → email exactly these instead of reading the sheet
 *
 *  NOTE: for very large lists, the Apps Script version
 *  (apps-script/Code.gs → sendReminders) is more reliable because it isn't
 *  bound by a serverless request timeout.
 * ============================================================================
 */

export const runtime = "nodejs"; // nodemailer needs the Node runtime, not edge
export const maxDuration = 60; // allow time to send a batch (Vercel plan permitting)

interface Options {
  token?: string;
  test?: string;
  dryRun?: boolean;
  resend?: boolean;
  preview?: boolean;
  sampleName?: string;
  audience?: Audience;
  content?: Partial<ReminderContent>;
  // A fully pre-rendered custom email (from the newsletter composer). When
  // present, it's sent as-is (with {{placeholders}} filled per recipient)
  // instead of building the reminder template.
  email?: { subject: string; html: string; text?: string };
  recipients?: Array<string | { email?: string; name?: string }>;
}

/** Build the outgoing message for one recipient — custom campaign or reminder. */
function buildFor(
  r: Recipient,
  email: Options["email"],
  content: Options["content"]
): { subject: string; html: string; text: string; ics?: string } {
  if (email) {
    return {
      subject: personalize(email.subject, r),
      html: personalize(email.html, r),
      text: personalize(email.text || "", r),
    };
  }
  return buildReminderEmail(r, content);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeRecipients(list: Options["recipients"]): Recipient[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: Recipient[] = [];
  for (const item of list) {
    const email = (typeof item === "string" ? item : item?.email || "").trim().toLowerCase();
    const name = typeof item === "string" ? "" : item?.name || "";
    if (!EMAIL_RE.test(email) || seen.has(email)) continue;
    seen.add(email);
    out.push({ email, name });
  }
  return out;
}

type Audience = "event" | "journal" | "all";

function inAudience(type: string, audience: Audience) {
  const isJournal = type.toLowerCase().includes("journal");
  if (audience === "journal") return isJournal;
  if (audience === "all") return true;
  return !isJournal; // "event" — event registrations (and any untyped rows)
}

/** Read the list from the Google Sheet, filtered by audience and de-duplicated. */
async function fetchRecipientsFromSheet(resend: boolean, audience: Audience): Promise<Recipient[]> {
  const base = process.env.SHEET_WEBHOOK_URL;
  const token = process.env.SHEET_API_TOKEN;
  if (!base || !token) {
    throw new Error(
      "To read the list, set SHEET_WEBHOOK_URL and SHEET_API_TOKEN (and add the doGet/markReminded code from apps-script/Code.gs to your sheet)."
    );
  }
  const url = `${base}${base.includes("?") ? "&" : "?"}action=list&token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Sheet list request failed: ${res.status}`);
  const data = (await res.json()) as {
    ok?: boolean;
    error?: string;
    registrants?: Array<{ email?: string; name?: string; type?: string; remindedAt?: string }>;
  };
  if (!data.ok) throw new Error(`Sheet API error: ${data.error || "unknown"}`);

  // De-dupe by email across both lists, so someone on the journal AND the
  // registration list is only emailed once.
  const seen = new Set<string>();
  const out: Recipient[] = [];
  for (const r of data.registrants || []) {
    const email = String(r.email || "").trim().toLowerCase();
    const type = String(r.type || "").trim();
    if (!EMAIL_RE.test(email) || seen.has(email)) continue;
    if (!inAudience(type, audience)) continue;
    if (!resend && r.remindedAt) continue;
    seen.add(email);
    out.push({ email, name: String(r.name || "") });
  }
  return out;
}

/** Ask the sheet to stamp these emails as reminded (best-effort). */
async function markReminded(emails: string[]) {
  const base = process.env.SHEET_WEBHOOK_URL;
  const token = process.env.SHEET_API_TOKEN;
  if (!base || !token || !emails.length) return;
  try {
    await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markReminded", token, emails }),
      redirect: "follow",
    });
  } catch (err) {
    console.error("[the-thinking-room] markReminded failed:", err);
  }
}

export async function POST(request: Request) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: "ADMIN_TOKEN is not set on the server." }, { status: 500 });
  }

  let body: Options = {};
  try {
    const text = await request.text();
    body = text ? (JSON.parse(text) as Options) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const url = new URL(request.url);
  const provided =
    request.headers.get("x-admin-token") || url.searchParams.get("token") || body.token || "";
  if (provided !== adminToken) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const dryRun = body.dryRun ?? url.searchParams.get("dryRun") === "1";
  const resend = body.resend ?? url.searchParams.get("resend") === "1";
  const test = body.test || url.searchParams.get("test") || "";
  const audience: Audience = body.audience || "event";
  const content = body.content;
  const transporter = getTransporter();

  // --- Preview: render the email without sending (powers the admin editor). ---
  if (body.preview) {
    const merged = { ...defaultReminderContent(), ...(content || {}) };
    const built = buildReminderEmail(
      { email: "preview@example.com", name: body.sampleName || "Ada" },
      merged
    );
    return NextResponse.json({ ok: true, mode: "preview", subject: built.subject, html: built.html, content: merged });
  }

  // --- Single test send: ignores the list entirely. ---
  if (test) {
    if (!EMAIL_RE.test(test)) {
      return NextResponse.json({ error: "Invalid test email." }, { status: 400 });
    }
    if (!transporter) {
      return NextResponse.json({ error: "GMAIL_USER/GMAIL_APP_PASSWORD not set." }, { status: 500 });
    }
    const built = buildFor({ email: test, name: body.sampleName || "there" }, body.email, content);
    await transporter.sendMail({
      from: `"The Thinking Room" <${process.env.GMAIL_USER}>`,
      to: test,
      subject: `[TEST] ${built.subject}`,
      html: built.html,
      text: built.text,
      ...(built.ics ? { attachments: [{ filename: "the-thinking-room.ics", content: built.ics }] } : {}),
    });
    return NextResponse.json({ ok: true, mode: "test", sentTo: test });
  }

  // --- Gather recipients (explicit list, or read the sheet). ---
  let recipients: Recipient[];
  try {
    recipients =
      body.recipients && body.recipients.length
        ? normalizeRecipients(body.recipients)
        : await fetchRecipientsFromSheet(resend, audience);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  if (dryRun) {
    return NextResponse.json({ ok: true, mode: "dryRun", count: recipients.length, recipients });
  }
  if (!transporter) {
    return NextResponse.json({ error: "GMAIL_USER/GMAIL_APP_PASSWORD not set." }, { status: 500 });
  }
  if (!recipients.length) {
    return NextResponse.json({ ok: true, sent: 0, message: "No recipients to email." });
  }

  // --- Send. ---
  const sentEmails: string[] = [];
  const failures: { email: string; error: string }[] = [];
  for (const r of recipients) {
    try {
      const built = buildFor(r, body.email, content);
      await transporter.sendMail({
        from: `"The Thinking Room" <${process.env.GMAIL_USER}>`,
        to: r.email,
        subject: built.subject,
        html: built.html,
        text: built.text,
        ...(built.ics ? { attachments: [{ filename: "the-thinking-room.ics", content: built.ics }] } : {}),
      });
      sentEmails.push(r.email);
    } catch (err) {
      failures.push({ email: r.email, error: err instanceof Error ? err.message : String(err) });
    }
  }

  await markReminded(sentEmails);

  console.log(
    `[the-thinking-room] Reminder endpoint: sent ${sentEmails.length}, failed ${failures.length}`
  );
  return NextResponse.json({
    ok: true,
    sent: sentEmails.length,
    failed: failures.length,
    failures,
  });
}
