/**
 * Shared helpers for event emails (used by the reminder endpoint at
 * app/api/send-reminders). These mirror the helpers inside
 * app/api/register/route.ts — the confirmation email there predates this file
 * and is intentionally left untouched so the working registration flow can't
 * regress. If you refactor, consider having route.ts import from here too.
 */
import nodemailer from "nodemailer";
import { site } from "../content";

export const EVENT_TIMEZONE = "Africa/Lagos"; // WAT, UTC+1 year-round

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Shared Gmail SMTP transporter. Returns null if the credentials aren't set. */
export function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
}

function ordinal(n: number) {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
}

/** "23rd July 2026" in the event's timezone, regardless of server timezone. */
export function formatEventDate(date: Date) {
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

/** "7:00pm WAT" in the event's timezone, regardless of server timezone. */
export function formatEventTime(date: Date) {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return `${time.replace(" ", "").toLowerCase()} WAT`;
}

function formatUtcStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function extractMeetingId(link: string) {
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

function buildIcs(opts: {
  uid: string;
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
}) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Thinking Room//Reminder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${opts.uid}`,
    `DTSTAMP:${formatUtcStamp(new Date())}`,
    `DTSTART:${formatUtcStamp(opts.start)}`,
    `DTEND:${formatUtcStamp(opts.end)}`,
    `SUMMARY:${escapeIcsText(opts.title)}`,
    `DESCRIPTION:${escapeIcsText(opts.description)}`,
    `LOCATION:${escapeIcsText(opts.location)}`,
    `URL:${escapeIcsText(opts.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export interface Recipient {
  email: string;
  name?: string;
}

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
  ics: string;
}

/**
 * Build the reminder email for one recipient. Pulls the date/time from
 * content.ts and the Zoom details from env vars (ZOOM_LINK / ZOOM_MEETING_ID /
 * ZOOM_PASSCODE), so it always matches what registrants were originally sent.
 */
export function buildReminderEmail(recipient: Recipient): BuiltEmail {
  const start = new Date(site.event.startISO);
  const end = new Date(start.getTime() + site.event.durationMinutes * 60_000);
  const eventDate = formatEventDate(start);
  const eventTime = formatEventTime(start);
  const eventTitle = `${site.brand.name} — ${site.hero.edition}`;
  const theme = `${site.hero.titleTop} ${site.hero.titleBottom}`;
  const firstName = escapeHtml((recipient.name || "").trim().split(/\s+/)[0] || "there");

  const zoomLink = process.env.ZOOM_LINK;
  const meetingId = process.env.ZOOM_MEETING_ID || (zoomLink ? extractMeetingId(zoomLink) : null);
  const passcode = process.env.ZOOM_PASSCODE;

  const meetingRows = zoomLink
    ? `<tr>
         <td style="padding:10px 0;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;vertical-align:top;">Join Using</td>
         <td style="padding:10px 0;"><a href="${escapeHtml(zoomLink)}" style="color:#dd2525;font-weight:700;word-break:break-all;">${escapeHtml(zoomLink)}</a></td>
       </tr>
       ${meetingId ? `<tr><td style="padding:10px 0;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">Meeting ID</td><td style="padding:10px 0;color:#f4efe6;font-size:15px;font-weight:700;">${escapeHtml(meetingId)}</td></tr>` : ""}
       ${passcode ? `<tr><td style="padding:10px 0;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">Passcode</td><td style="padding:10px 0;color:#f4efe6;font-size:15px;font-weight:700;">${escapeHtml(passcode)}</td></tr>` : ""}`
    : `<tr><td colspan="2" style="padding:10px 0;color:#ac9f8c;font-size:14px;">The Zoom details are in your confirmation email — keep it handy.</td></tr>`;

  const html = `
    <div style="background:#0a0a0a;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#111111;border:1px solid rgba(221,37,37,0.3);border-radius:8px;overflow:hidden;">
        <div style="background:linear-gradient(180deg,#ff4d4d,#dd2525);padding:24px 32px;">
          <p style="margin:0;color:#ffffff;font-size:11px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;">The Thinking Room</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;text-transform:uppercase;">It's Almost Time.</h1>
        </div>
        <div style="padding:28px 32px;">
          <p style="margin:0 0 16px;color:#f4efe6;font-size:15px;line-height:1.7;">Hello ${firstName},</p>
          <p style="margin:0 0 16px;color:#f4efe6;font-size:15px;line-height:1.7;">
            A quick reminder that your seat at <strong style="color:#d1ff00;">${escapeHtml(site.hero.edition)}</strong> of The Thinking Room is waiting — we begin <strong>${escapeHtml(eventDate)}</strong> at <strong>${escapeHtml(eventTime)}</strong>.
          </p>
          <p style="margin:0 0 24px;color:#ac9f8c;font-size:14px;line-height:1.7;">
            This isn't another webinar — it's a conversation that challenges assumptions, examines ideas, and creates clarity. Come ready to think.
          </p>
          <p style="margin:0 0 4px;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">Theme</p>
          <p style="margin:0 0 24px;color:#f4efe6;font-size:17px;font-weight:700;">${escapeHtml(theme)}</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr><td style="padding:10px 0;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;width:130px;">📅 Date</td><td style="padding:10px 0;color:#f4efe6;font-size:15px;font-weight:700;">${escapeHtml(eventDate)}</td></tr>
            <tr><td style="padding:10px 0;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">🕒 Time</td><td style="padding:10px 0;color:#f4efe6;font-size:15px;font-weight:700;">${escapeHtml(eventTime)}</td></tr>
            ${meetingRows}
          </table>
          <p style="margin:0;color:#ac9f8c;font-size:14px;line-height:1.7;">See you in the room.</p>
          <p style="margin:16px 0 0;color:#6d6353;font-size:12px;">— The Thinking Room</p>
        </div>
      </div>
    </div>`;

  const textLines = [
    `Hello ${recipient.name?.split(/\s+/)[0] || "there"},`,
    "",
    `A quick reminder that ${site.hero.edition} of The Thinking Room begins ${eventDate} at ${eventTime}.`,
    "",
    `Theme: ${theme}`,
    "",
  ];
  if (zoomLink) textLines.push(`Join: ${zoomLink}`);
  if (meetingId) textLines.push(`Meeting ID: ${meetingId}`);
  if (passcode) textLines.push(`Passcode: ${passcode}`);
  textLines.push("", "See you in the room.", "— The Thinking Room");

  const ics = buildIcs({
    uid: `reminder-${Date.now()}-${recipient.email}@thethinkingroom`,
    title: eventTitle,
    description: [
      `${site.hero.edition} of The Thinking Room.`,
      zoomLink ? `Join using: ${zoomLink}` : "",
      meetingId ? `Meeting ID: ${meetingId}` : "",
      passcode ? `Passcode: ${passcode}` : "",
    ].filter(Boolean).join("\n"),
    location: zoomLink || "Zoom",
    start,
    end,
  });

  return {
    subject: process.env.REMINDER_SUBJECT || `Reminder: ${site.brand.name} — ${eventDate}`,
    html,
    text: textLines.join("\n"),
    ics,
  };
}
