import { NextResponse } from "next/server";

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
  await Promise.allSettled([sendToSheet(record), sendEmail(record)]);

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

/** Email the submission to you via Resend. */
async function sendEmail(record: Record<string, string>) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  const from = process.env.FROM_EMAIL || "onboarding@resend.dev";
  if (!apiKey || !to) return; // not configured yet

  const rows = Object.entries(record)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#888">${k}</td><td>${v || "—"}</td></tr>`
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
