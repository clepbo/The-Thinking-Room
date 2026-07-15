import { NextResponse } from "next/server";

/**
 * ============================================================================
 *  REGISTRATION / JOURNAL FORM HANDLER
 * ============================================================================
 *  Both the "Reserve Your Seat" form and the Journal signup POST here.
 *
 *  OUT OF THE BOX: this validates the submission and logs it to the server
 *  console (visible in Vercel → your project → Logs). That means the form
 *  works the moment you deploy — nothing to configure.
 *
 *  TO ACTUALLY RECEIVE THE SIGNUPS BY EMAIL (recommended):
 *    1. Create a free account at https://resend.com and verify a sending
 *       domain (or use their onboarding test address to start).
 *    2. In Vercel → Project → Settings → Environment Variables, add:
 *         RESEND_API_KEY   = <your Resend API key>
 *         NOTIFY_EMAIL     = the address that should receive registrations
 *         FROM_EMAIL       = a verified sender, e.g. hello@thethinkingroom.co
 *    3. Redeploy. Each signup will now be emailed to NOTIFY_EMAIL.
 *
 *  Prefer a Google Sheet, Mailchimp, Airtable, etc.? Replace the
 *  `deliver()` call below with a fetch to that service's API — the shape of
 *  `payload` is already assembled for you.
 * ============================================================================
 */

interface Payload {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
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
    source: payload.source === "journal" ? "Journal signup" : "Event registration",
    submittedAt: new Date().toISOString(),
  };

  // Always visible in your Vercel logs, even without email configured.
  console.log("[the-thinking-room] new signup:", record);

  try {
    await deliver(record);
  } catch (err) {
    // Don't fail the user's submission if the notification email hiccups —
    // the record is already in the logs above.
    console.error("[the-thinking-room] delivery failed:", err);
  }

  return NextResponse.json({ ok: true });
}

async function deliver(record: Record<string, string>) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  const from = process.env.FROM_EMAIL || "onboarding@resend.dev";

  // No email service configured yet — that's fine, we already logged it.
  if (!apiKey || !to) return;

  const rows = Object.entries(record)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#888">${k}</td><td>${v || "—"}</td></tr>`)
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
