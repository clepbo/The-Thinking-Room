/**
 * ============================================================================
 *  THE THINKING ROOM — SEND A REMINDER EMAIL TO ALL REGISTRANTS
 * ============================================================================
 *  Paste this into the SAME Apps Script project that's bound to your
 *  "Registrations" Google Sheet (Extensions → Apps Script), below your
 *  existing doPost function. It reads the sheet, then emails every event
 *  registrant a reminder — sent from your own Gmail, so no extra setup.
 *
 *  ────────────────────────────────────────────────────────────────────────
 *  HOW TO SEND (do these in order — the safe way)
 *  ────────────────────────────────────────────────────────────────────────
 *   1. Fill in the CONFIG block below (Zoom details, date/time, your test
 *      address). These are the SAME values you already use on the site.
 *   2. Save (💾).
 *   3. In the function dropdown, pick  sendReminderTest  → Run.
 *      → Sends ONE reminder to TEST_EMAIL only. Check how it looks.
 *   4. Pick  previewReminders  → Run, then open View → Logs.
 *      → Sends nothing. Just lists who WOULD get it, and how many.
 *   5. When you're happy, pick  sendReminders  → Run.
 *      → Sends to everyone. Each person is marked "Reminded At" in a new
 *        column, so running it again won't email the same people twice.
 *
 *  The first run will ask you to authorize Gmail access — approve it (it's
 *  your own account sending on your behalf).
 * ============================================================================
 */

// ─────────────────────────────── CONFIG ───────────────────────────────────
var CONFIG = {
  // What the session is called in the email.
  EVENT_EDITION: "Edition 001",
  EVENT_THEME: "Too Much to Choose. Too Little to Show.",

  // When it happens (shown to the reader — plain text, your wording).
  EVENT_DATE: "Today, Thursday 23 July 2026",
  EVENT_TIME: "7:00 PM (WAT)",

  // Zoom join details — paste your real ones (same as the site's env vars).
  // Leave a field as "" to hide that row.
  ZOOM_LINK: "",       // e.g. "https://us02web.zoom.us/j/81886687384?pwd=..."
  ZOOM_MEETING_ID: "", // e.g. "818 8668 7384"  (optional)
  ZOOM_PASSCODE: "",   // e.g. "123456"          (optional)

  // The email itself.
  SUBJECT: "Reminder: The Thinking Room is today at 7:00 PM WAT",
  SENDER_NAME: "The Thinking Room",

  // Send a test copy here first (step 3 above).
  TEST_EMAIL: "you@example.com",

  // Which registrations to include. The sheet's "Type" column is either
  // "Event registration" or "Journal signup" — we only want the former.
  ONLY_TYPE: "Event registration",

  // Sheet + bookkeeping.
  SHEET_NAME: "Registrations",
  REMINDED_HEADER: "Reminded At", // a column we add to prevent double-sends
  SKIP_ALREADY_REMINDED: true,    // set false to force a re-send to everyone
};
// ───────────────────────────────────────────────────────────────────────────


/** ▶ STEP 3 — send ONE test email to yourself. */
function sendReminderTest() {
  var html = buildReminderHtml("there");
  GmailApp.sendEmail(CONFIG.TEST_EMAIL, "[TEST] " + CONFIG.SUBJECT, plainTextFallback("there"), {
    name: CONFIG.SENDER_NAME,
    htmlBody: html,
  });
  Logger.log("Test reminder sent to " + CONFIG.TEST_EMAIL);
}

/** ▶ STEP 4 — list recipients WITHOUT sending anything. */
function previewReminders() {
  var recipients = collectRecipients();
  Logger.log("Would send to " + recipients.length + " registrant(s):");
  recipients.forEach(function (r) {
    Logger.log("  • " + (r.name || "(no name)") + "  <" + r.email + ">");
  });
  if (!recipients.length) {
    Logger.log("Nobody to send to. Check SHEET_NAME / ONLY_TYPE / the sheet has rows.");
  }
}

/** ▶ STEP 5 — send the reminder to everyone (marks each as reminded). */
function sendReminders() {
  var sheet = getSheet();
  var recipients = collectRecipients();
  if (!recipients.length) {
    Logger.log("Nobody to send to — nothing done.");
    return;
  }

  var remindedCol = ensureRemindedColumn(sheet);
  var sent = 0;
  var failures = [];

  recipients.forEach(function (r) {
    try {
      var firstName = (r.name || "").trim().split(/\s+/)[0] || "there";
      GmailApp.sendEmail(r.email, CONFIG.SUBJECT, plainTextFallback(firstName), {
        name: CONFIG.SENDER_NAME,
        htmlBody: buildReminderHtml(firstName),
      });
      sheet.getRange(r.row, remindedCol).setValue(new Date());
      sent++;
      Utilities.sleep(300); // be gentle on Gmail's rate limits
    } catch (err) {
      failures.push(r.email + " — " + err);
    }
  });

  Logger.log("Reminder sent to " + sent + " of " + recipients.length + " registrant(s).");
  if (failures.length) {
    Logger.log("Failures (" + failures.length + "):");
    failures.forEach(function (f) { Logger.log("  ✗ " + f); });
  }
  Logger.log(
    "Gmail messages remaining in today's quota: " + MailApp.getRemainingDailyQuota()
  );
}


// ──────────────────────────── helpers ─────────────────────────────────────

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('No sheet named "' + CONFIG.SHEET_NAME + '".');
  return sheet;
}

/** Read the sheet and return [{ row, name, email }] for valid, in-scope rows. */
function collectRecipients() {
  var sheet = getSheet();
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  var header = values[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var emailCol = indexOfHeader(header, ["email", "email address"], 3);
  var nameCol = indexOfHeader(header, ["name", "full name"], 2);
  var typeCol = indexOfHeader(header, ["type", "source"], 1);
  var remindedCol = header.indexOf(CONFIG.REMINDED_HEADER.toLowerCase());

  var seen = {};
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var rowValues = values[i];
    var email = String(rowValues[emailCol] || "").trim().toLowerCase();
    if (!isValidEmail(email) || seen[email]) continue;

    if (CONFIG.ONLY_TYPE && typeCol >= 0) {
      var type = String(rowValues[typeCol] || "").trim().toLowerCase();
      if (type && type !== CONFIG.ONLY_TYPE.toLowerCase()) continue;
    }
    if (CONFIG.SKIP_ALREADY_REMINDED && remindedCol >= 0 && rowValues[remindedCol]) continue;

    seen[email] = true;
    out.push({ row: i + 1, name: String(rowValues[nameCol] || "").trim(), email: email });
  }
  return out;
}

function indexOfHeader(header, candidates, fallback) {
  for (var i = 0; i < candidates.length; i++) {
    var idx = header.indexOf(candidates[i]);
    if (idx >= 0) return idx;
  }
  return fallback;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Find (or create) the "Reminded At" column and return its 1-based index. */
function ensureRemindedColumn(sheet) {
  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (var i = 0; i < header.length; i++) {
    if (String(header[i]).trim().toLowerCase() === CONFIG.REMINDED_HEADER.toLowerCase()) {
      return i + 1;
    }
  }
  var col = sheet.getLastColumn() + 1;
  sheet.getRange(1, col).setValue(CONFIG.REMINDED_HEADER);
  return col;
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Plain-text version for email clients that don't render HTML. */
function plainTextFallback(firstName) {
  var lines = [
    "Hello " + firstName + ",",
    "",
    "A quick reminder that The Thinking Room (" + CONFIG.EVENT_EDITION + ") is happening " +
      CONFIG.EVENT_DATE + " at " + CONFIG.EVENT_TIME + ".",
    "",
    "Theme: " + CONFIG.EVENT_THEME,
    "",
  ];
  if (CONFIG.ZOOM_LINK) lines.push("Join: " + CONFIG.ZOOM_LINK);
  if (CONFIG.ZOOM_MEETING_ID) lines.push("Meeting ID: " + CONFIG.ZOOM_MEETING_ID);
  if (CONFIG.ZOOM_PASSCODE) lines.push("Passcode: " + CONFIG.ZOOM_PASSCODE);
  lines.push("", "See you in the room.", "— The Thinking Room");
  return lines.join("\n");
}

/** The branded HTML reminder (matches the confirmation email's look). */
function buildReminderHtml(firstName) {
  var meetingRows = "";
  if (CONFIG.ZOOM_LINK) {
    meetingRows +=
      '<tr><td style="padding:10px 0;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;vertical-align:top;">Join Using</td>' +
      '<td style="padding:10px 0;"><a href="' + esc(CONFIG.ZOOM_LINK) + '" style="color:#dd2525;font-weight:700;word-break:break-all;">' + esc(CONFIG.ZOOM_LINK) + "</a></td></tr>";
  }
  if (CONFIG.ZOOM_MEETING_ID) {
    meetingRows +=
      '<tr><td style="padding:10px 0;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">Meeting ID</td>' +
      '<td style="padding:10px 0;color:#f4efe6;font-size:15px;font-weight:700;">' + esc(CONFIG.ZOOM_MEETING_ID) + "</td></tr>";
  }
  if (CONFIG.ZOOM_PASSCODE) {
    meetingRows +=
      '<tr><td style="padding:10px 0;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">Passcode</td>' +
      '<td style="padding:10px 0;color:#f4efe6;font-size:15px;font-weight:700;">' + esc(CONFIG.ZOOM_PASSCODE) + "</td></tr>";
  }
  if (!meetingRows) {
    meetingRows =
      '<tr><td colspan="2" style="padding:10px 0;color:#ac9f8c;font-size:14px;">The Zoom details are in your confirmation email — keep it handy for tonight.</td></tr>';
  }

  return '' +
    '<div style="background:#0a0a0a;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">' +
      '<div style="max-width:560px;margin:0 auto;background:#111111;border:1px solid rgba(221,37,37,0.3);border-radius:8px;overflow:hidden;">' +
        '<div style="background:linear-gradient(180deg,#ff4d4d,#dd2525);padding:24px 32px;">' +
          '<p style="margin:0;color:#ffffff;font-size:11px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;">The Thinking Room</p>' +
          '<h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;text-transform:uppercase;">It\'s Today.</h1>' +
        '</div>' +
        '<div style="padding:28px 32px;">' +
          '<p style="margin:0 0 16px;color:#f4efe6;font-size:15px;line-height:1.7;">Hello ' + esc(firstName) + ',</p>' +
          '<p style="margin:0 0 16px;color:#f4efe6;font-size:15px;line-height:1.7;">A quick reminder that your seat at <strong style="color:#d1ff00;">' + esc(CONFIG.EVENT_EDITION) + '</strong> of The Thinking Room is waiting — we begin <strong>' + esc(CONFIG.EVENT_DATE) + '</strong>.</p>' +
          '<p style="margin:0 0 24px;color:#ac9f8c;font-size:14px;line-height:1.7;">This isn\'t another webinar — it\'s a conversation that challenges assumptions, examines ideas, and creates clarity. Come ready to think.</p>' +
          '<p style="margin:0 0 4px;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">Theme</p>' +
          '<p style="margin:0 0 24px;color:#f4efe6;font-size:17px;font-weight:700;">' + esc(CONFIG.EVENT_THEME) + '</p>' +
          '<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">' +
            '<tr><td style="padding:10px 0;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;width:130px;">📅 Date</td>' +
            '<td style="padding:10px 0;color:#f4efe6;font-size:15px;font-weight:700;">' + esc(CONFIG.EVENT_DATE) + '</td></tr>' +
            '<tr><td style="padding:10px 0;color:#8a8a8a;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">🕒 Time</td>' +
            '<td style="padding:10px 0;color:#f4efe6;font-size:15px;font-weight:700;">' + esc(CONFIG.EVENT_TIME) + '</td></tr>' +
            meetingRows +
          '</table>' +
          '<p style="margin:0;color:#ac9f8c;font-size:14px;line-height:1.7;">See you in the room.</p>' +
          '<p style="margin:16px 0 0;color:#6d6353;font-size:12px;">— The Thinking Room</p>' +
        '</div>' +
      '</div>' +
    '</div>';
}
