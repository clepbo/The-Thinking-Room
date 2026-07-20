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
 *  see `sendConfirmationEmail` below. It reuses RESEND_API_KEY / FROM_EMAIL,
 *  reads the date/time straight from app/content.ts (`site.event.startISO`)
 *  so it's always in sync with what's on the page, and attaches a calendar
 *  invite (.ics) plus an "Add to Google Calendar" link. The Zoom details
 *  come from these env vars (kept out of content.ts on purpose — that file
 *  ships to the browser, so real meeting details there would be visible to
 *  anyone before they register):
 *
 *    ZOOM_LINK          the meeting URL
 *    ZOOM_MEETING_ID    optional — auto-parsed from ZOOM_LINK if omitted
 *    ZOOM_PASSCODE      optional — Zoom doesn't expose this in the URL, so
 *                       it has to be set by hand
 *
 *  Setup steps are in the README.
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
  // fail the user's submission or block the others — but it must still be
  // logged, or a broken channel fails silently forever. Check Vercel →
  // your project → Logs after a test submission to see these.
  const tasks: [string, Promise<void>][] = [
    ["Google Sheet", sendToSheet(record)],
    ["Owner notification email", sendEmail(record)],
  ];
  if (record.source === "Event registration") {
    tasks.push(["Registrant confirmation email", sendConfirmationEmail(record)]);
  }
  const results = await Promise.allSettled(tasks.map(([, task]) => task));
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const [label] = tasks[i];
      console.error(`[the-thinking-room] ${label} failed:`, result.reason);
    }
  });

  return NextResponse.json({ ok: true });
}

/** Append the submission as a row in your Google Sheet. */
async function sendToSheet(record: Record<string, string>) {
  const url = process.env.SHEET_WEBHOOK_URL;
  if (!url) {
    console.log("[the-thinking-room] Google Sheet skipped — SHEET_WEBHOOK_URL not set");
    return;
  }

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
  if (!apiKey || !to) {
    console.log(
      `[the-thinking-room] Owner notification email skipped — missing ${!apiKey ? "RESEND_API_KEY" : "NOTIFY_EMAIL"}`
    );
    return;
  }

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
  console.log("[the-thinking-room] Owner notification email: sent");
}

const EVENT_TIMEZONE = "Africa/Lagos"; // WAT, UTC+1 year-round — no DST to worry about

function ordinal(n: number) {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
}

/** "23rd July 2026" in the event's timezone, regardless of server timezone. */
function formatEventDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(date);
  const day = Number(parts.find((p) => p.type === "day")!.value);
  const month = parts.find((p) => p.type === "month")!.value;
  const year = parts.find((p) => p.type === "year")!.value;
  return `${ordinal(day)} ${month} ${year}`;
}

/** "7:30pm WAT" in the event's timezone, regardless of server timezone. */
function formatEventTime(date: Date) {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return `${time.replace(" ", "").toLowerCase()} WAT`;
}

/** YYYYMMDDTHHMMSSZ, the timestamp format both .ics and Google Calendar links need. */
function formatUtcStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/** Pulls "818 8668 7384" out of a Zoom join URL like .../j/81886687384?pwd=... */
function extractMeetingId(link: string) {
  const match = link.match(/\/j\/(\d+)/);
  if (!match) return null;
  const id = match[1];
  if (id.length === 11) return `${id.slice(0, 3)} ${id.slice(3, 7)} ${id.slice(7)}`;
  if (id.length === 10) return `${id.slice(0, 3)} ${id.slice(3, 6)} ${id.slice(6)}`;
  return id;
}

function escapeIcsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

/** A minimal but valid .ics VEVENT, attached so Outlook/Apple Calendar/etc. can add it directly. */
function buildIcs({
  uid,
  title,
  description,
  location,
  start,
  end,
}: {
  uid: string;
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Thinking Room//Registration//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatUtcStamp(new Date())}`,
    `DTSTART:${formatUtcStamp(start)}`,
    `DTEND:${formatUtcStamp(end)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    `URL:${escapeIcsText(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

function googleCalendarLink({
  title,
  description,
  location,
  start,
  end,
}: {
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
}) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatUtcStamp(start)}/${formatUtcStamp(end)}`,
    details: description,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Auto-reply to the person who just registered: confirms their seat, hands
 * them the Zoom link/Meeting ID/Passcode, and gives them a one-click way to
 * add the session to their calendar (a Google Calendar link plus an
 * attached .ics file for everyone else). Fires only for the "Reserve Your
 * Seat" form (not the Journal signup — that's a newsletter, not an RSVP).
 * Uses the same Resend credentials as the owner notification above, so no
 * extra setup beyond what's already in the README.
 */
async function sendConfirmationEmail(record: Record<string, string>) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL || "onboarding@resend.dev";
  if (!apiKey || !record.email) {
    console.log("[the-thinking-room] Registrant confirmation email skipped — RESEND_API_KEY not set");
    return;
  }

  const start = new Date(site.event.startISO);
  const end = new Date(start.getTime() + site.event.durationMinutes * 60_000);
  const eventDate = formatEventDate(start);
  const eventTime = formatEventTime(start);
  const eventTitle = `${site.brand.name} — ${site.hero.edition}`;

  const zoomLink = process.env.ZOOM_LINK;
  const meetingId = process.env.ZOOM_MEETING_ID || (zoomLink ? extractMeetingId(zoomLink) : null);
  const passcode = process.env.ZOOM_PASSCODE;
  const firstName = escapeHtml((record.name || "").trim().split(/\s+/)[0] || "there");

  const meetingRows = zoomLink
    ? `<tr>
         <td style="padding:10px 0;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;vertical-align:top;">Join Using</td>
         <td style="padding:10px 0;"><a href="${escapeHtml(zoomLink)}" style="color:#dd2525;font-weight:700;word-break:break-all;">${escapeHtml(zoomLink)}</a></td>
       </tr>
       ${
         meetingId
           ? `<tr>
                <td style="padding:10px 0;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">Meeting ID</td>
                <td style="padding:10px 0;color:#f4efe6;font-size:15px;font-weight:700;">${escapeHtml(meetingId)}</td>
              </tr>`
           : ""
       }
       ${
         passcode
           ? `<tr>
                <td style="padding:10px 0;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">Passcode</td>
                <td style="padding:10px 0;color:#f4efe6;font-size:15px;font-weight:700;">${escapeHtml(passcode)}</td>
              </tr>`
           : ""
       }`
    : `<tr>
         <td colspan="2" style="padding:10px 0;color:#ac9f8c;font-size:14px;">
           Your Zoom link is on its way — we'll send it in a reminder email before the session starts.
         </td>
       </tr>`;

  const calendarDescriptionParts = [
    `Thank you for registering for ${site.hero.edition} of The Thinking Room.`,
    zoomLink ? `Join using: ${zoomLink}` : "",
    meetingId ? `Meeting ID: ${meetingId}` : "",
    passcode ? `Passcode: ${passcode}` : "",
  ].filter(Boolean);
  const calendarDescription = calendarDescriptionParts.join("\n");
  const calendarLocation = zoomLink || "Zoom (link to follow)";

  const gcalLink = googleCalendarLink({
    title: eventTitle,
    description: calendarDescription,
    location: calendarLocation,
    start,
    end,
  });

  const ics = buildIcs({
    uid: `${record.submittedAt || Date.now()}-${record.email}@thethinkingroom`,
    title: eventTitle,
    description: calendarDescription,
    location: calendarLocation,
    start,
    end,
  });

  const html = `
    <div style="background:#0a0a0a;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#111111;border:1px solid rgba(221,37,37,0.3);border-radius:8px;overflow:hidden;">
        <div style="background:linear-gradient(180deg,#ff4d4d,#dd2525);padding:24px 32px;">
          <p style="margin:0;color:#ffffff;font-size:11px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;">The Thinking Room</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;text-transform:uppercase;">Your Seat Is Reserved.</h1>
        </div>
        <div style="padding:28px 32px;">
          <p style="margin:0 0 16px;color:#f4efe6;font-size:15px;line-height:1.7;">Hello ${firstName},</p>
          <p style="margin:0 0 16px;color:#f4efe6;font-size:15px;line-height:1.7;">
            Thank you for registering for <strong style="color:#d1ff00;">${escapeHtml(site.hero.edition)}</strong> of The Thinking Room.
          </p>
          <p style="margin:0 0 16px;color:#f4efe6;font-size:15px;line-height:1.7;">Your seat has been reserved.</p>
          <p style="margin:0 0 16px;color:#ac9f8c;font-size:14px;line-height:1.7;">
            The Thinking Room was created for people who believe better thinking leads to better decisions, and better decisions lead to a better life.
          </p>
          <p style="margin:0 0 24px;color:#ac9f8c;font-size:14px;line-height:1.7;">
            This isn't another webinar but a conversation that challenges assumptions, examines ideas, and creates clarity.
          </p>

          <p style="margin:0 0 4px;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">Theme</p>
          <p style="margin:0 0 24px;color:#f4efe6;font-size:17px;font-weight:700;">
            ${escapeHtml(site.hero.titleTop)} ${escapeHtml(site.hero.titleBottom)}
          </p>

          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr>
              <td style="padding:10px 0;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;width:130px;">📅 Date</td>
              <td style="padding:10px 0;color:#f4efe6;font-size:15px;font-weight:700;">${escapeHtml(eventDate)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">🕒 Time</td>
              <td style="padding:10px 0;color:#f4efe6;font-size:15px;font-weight:700;">${escapeHtml(eventTime)}</td>
            </tr>
            ${meetingRows}
          </table>

          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr>
              <td align="center" style="border-radius:4px;background:#1a1a1a;border:1px solid rgba(209,255,0,0.35);">
                <a href="${gcalLink}" style="display:block;padding:12px 20px;color:#d1ff00;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">
                  + Add to Google Calendar
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 24px;color:#6d6353;font-size:12px;line-height:1.6;">
            Using Outlook or Apple Calendar instead? We've attached a calendar file to this email — just open it.
          </p>

          <p style="margin:0;color:#f4efe6;font-size:15px;line-height:1.7;">See you in the room.</p>
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
      attachments: [
        {
          filename: "the-thinking-room.ics",
          content: Buffer.from(ics, "utf-8").toString("base64"),
        },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend confirmation email responded ${res.status}: ${await res.text()}`);
  }
  console.log(`[the-thinking-room] Registrant confirmation email: sent to ${record.email}`);
}
