import { NextResponse } from "next/server";
import { site } from "../../content";

/**
 * ============================================================================
 *  REGISTRATION / JOURNAL FORM HANDLER
 * ============================================================================
 *  Both the "Reserve Your Seat" form and the Journal signup POST here.
 *
 *  Every submission is delivered to as many of these as you've configured:
 *
 *    1. GOOGLE SHEET  (recommended — a list you can open anytime)
 *       Set the env var  SHEET_WEBHOOK_URL  to your Google Apps Script web-app
 *       URL. Setup steps are in the README ("Where does the form data go?").
 *       Every signup becomes a new row in your spreadsheet.
 *
 *    2. EMAIL via Resend  (optional — get an email per signup)
 *       Set  RESEND_API_KEY,  NOTIFY_EMAIL,  and  FROM_EMAIL.
 *
 *    3. VERCEL LOGS  (always on, no setup — a safety net)
 *       Every submission is also logged (Vercel → your project → Logs).
 *
 *  Event registrants (not Journal subscribers) also get an automatic reply —
 *  see `sendConfirmationEmail` below. It reuses RESEND_API_KEY / FROM_EMAIL
 *  and reads the date/time straight from app/content.ts, so it's always in
 *  sync with what's on the page. The Zoom link comes from the ZOOM_LINK env
 *  var (kept out of content.ts on purpose — that file ships to the browser,
 *  so a real meeting link there would be visible to anyone before they
 *  register). Setup steps are in the README.
 *
 *  If none of the above is configured, the form still works and the data is in
 *  the logs — but set up the Google Sheet so you have a durable, browsable list.
 * ============================================================================
 */

interface Payload {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  expectations?: string;
  source?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let payload: Payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = (payload.email || "").trim();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const record = {
    name: (payload.name || "").trim(),
    email,
    phone: (payload.phone || "").trim(),
    role: (payload.role || "").trim(),
    expectations: (payload.expectations || "").trim(),
    source: payload.source === "journal" ? "Journal signup" : "Event registration",
    submittedAt: new Date().toISOString(),
  };

  // Always visible in your Vercel logs, even without anything else configured.
  console.log("[the-thinking-room] new signup:", record);

  // Deliver everywhere that's configured. A failure in one channel must not
  // fail the user's submission or block the others.
  const tasks = [sendToSheet(record), sendEmail(record)];
  if (record.source === "Event registration") {
    tasks.push(sendConfirmationEmail(record));
  }
  await Promise.allSettled(tasks);

  return NextResponse.json({ ok: true });
}

/** Append the submission as a row in your Google Sheet. */
async function sendToSheet(record: Record<string, string>) {
  const url = process.env.SHEET_WEBHOOK_URL;
  if (!url) return; // not configured yet

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
    redirect: "follow", // Apps Script responds via a redirect
  });
  if (!res.ok) {
    throw new Error(`Google Sheet webhook responded ${res.status}`);
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Email the submission to you via Resend. */
async function sendEmail(record: Record<string, string>) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  const from = process.env.FROM_EMAIL || "onboarding@resend.dev";
  if (!apiKey || !to) return; // not configured yet

  const rows = Object.entries(record)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#888">${escapeHtml(k)}</td><td>${escapeHtml(v) || "—"}</td></tr>`
    )
    .join("");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `New ${record.source} — The Thinking Room`,
      html: `<h2>New ${record.source}</h2><table>${rows}</table>`,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
  }
}

/**
 * Auto-reply to the person who just registered: confirms their seat and
 * hands them the date, time, and Zoom link. Fires only for the "Reserve
 * Your Seat" form (not the Journal signup — that's a newsletter, not an
 * RSVP). Uses the same Resend credentials as the owner notification above,
 * so no extra setup beyond what's already in the README.
 */
async function sendConfirmationEmail(record: Record<string, string>) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL || "onboarding@resend.dev";
  if (!apiKey || !record.email) return; // not configured yet

  const eventDate = site.details.find((d) => d.label === "Date")?.value ?? "";
  const eventTime = site.details.find((d) => d.label === "Time")?.value ?? "";
  const zoomLink = process.env.ZOOM_LINK;
  const firstName = escapeHtml((record.name || "").trim().split(/\s+/)[0] || "there");

  const linkRow = zoomLink
    ? `<tr>
         <td style="padding:10px 0;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">Zoom Link</td>
         <td style="padding:10px 0;"><a href="${escapeHtml(zoomLink)}" style="color:#dd2525;font-weight:700;">${escapeHtml(zoomLink)}</a></td>
       </tr>`
    : `<tr>
         <td colspan="2" style="padding:10px 0;color:#ac9f8c;font-size:14px;">
           Your Zoom link is on its way — we'll send it in a reminder email before the session starts.
         </td>
       </tr>`;

  const html = `
    <div style="background:#0a0a0a;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#111111;border:1px solid rgba(221,37,37,0.3);border-radius:8px;overflow:hidden;">
        <div style="background:linear-gradient(180deg,#ff4d4d,#dd2525);padding:24px 32px;">
          <p style="margin:0;color:#f4efe6;font-size:11px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;">The Thinking Room</p>
          <h1 style="margin:8px 0 0;color:#f4efe6;font-size:26px;text-transform:uppercase;">You're In, ${firstName}.</h1>
        </div>
        <div style="padding:28px 32px;">
          <p style="margin:0 0 20px;color:#f4efe6;font-size:15px;line-height:1.6;">
            Your seat for <strong style="color:#d1ff00;">${escapeHtml(site.brand.name)}</strong> is confirmed. Here are the details:
          </p>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;width:120px;">Date</td>
              <td style="padding:10px 0;color:#f4efe6;font-size:15px;font-weight:700;">${escapeHtml(eventDate)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">Time</td>
              <td style="padding:10px 0;color:#f4efe6;font-size:15px;font-weight:700;">${escapeHtml(eventTime)}</td>
            </tr>
            ${linkRow}
          </table>
          <p style="margin:24px 0 0;color:#6d6353;font-size:13px;line-height:1.6;">
            Add it to your calendar and keep an eye on your inbox — we'll send a reminder before we go live.
          </p>
        </div>
      </div>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: record.email,
      subject: `You're confirmed — ${site.brand.name}, ${eventDate}`,
      html,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend confirmation email responded ${res.status}: ${await res.text()}`);
  }
}
