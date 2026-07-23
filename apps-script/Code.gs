/**
 * ============================================================================
 *  THE THINKING ROOM — GOOGLE SHEET SCRIPT (complete)
 * ============================================================================
 *  Paste this ENTIRE file into your sheet's Apps Script (Extensions → Apps
 *  Script), replacing whatever's there, then Save. It does three jobs:
 *
 *    1. doPost  — receives new registrations from the website and appends a
 *                 row (this is what your site already relies on). It also
 *                 handles an { action: "markReminded" } call from the site's
 *                 reminder endpoint.
 *    2. doGet   — lets the website's /api/send-reminders endpoint read the
 *                 registrant list (protected by CONFIG.API_TOKEN).
 *    3. Manual reminder senders you can run right from this editor:
 *                 sendReminderTest → previewReminders → sendReminders
 *
 *  AFTER EDITING: re-publish so changes go live —
 *  Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.
 *  (The web app URL stays the same.)
 * ============================================================================
 */

// ─────────────────────────────── CONFIG ───────────────────────────────────
var CONFIG = {
  SHEET_NAME: "Registrations",
  REMINDED_HEADER: "Reminded At",

  // Shared secret the WEBSITE uses to read the list / mark reminded.
  // Must equal SHEET_API_TOKEN in your Vercel env vars. Make it long + random.
  // Leave "" to disable the website's read/mark access (manual senders below
  // still work regardless).
  API_TOKEN: "",

  // ---- Reminder email (used by the manual senders in THIS file) ----
  EVENT_EDITION: "Edition 001",
  EVENT_THEME: "Too Much to Choose. Too Little to Show.",
  EVENT_DATE: "Today, Thursday 23 July 2026",
  EVENT_TIME: "7:00 PM (WAT)",

  ZOOM_LINK: "",       // paste your real Zoom join URL
  ZOOM_MEETING_ID: "", // optional
  ZOOM_PASSCODE: "",   // optional

  SUBJECT: "Reminder: The Thinking Room is today at 7:00 PM WAT",
  SENDER_NAME: "The Thinking Room",
  TEST_EMAIL: "you@example.com",

  ONLY_TYPE: "Event registration",
  SKIP_ALREADY_REMINDED: true,
};
// ───────────────────────────────────────────────────────────────────────────


// ============================ WEB APP (site) ===============================

/** Website → new registration, or { action: "markReminded", token, emails }. */
function doPost(e) {
  try {
    var d = {};
    if (e && e.postData && e.postData.contents) d = JSON.parse(e.postData.contents);
    else if (e && e.parameter) d = e.parameter;

    if (d.action === "markReminded") {
      if (!authorized(d.token)) return json({ ok: false, error: "unauthorized" });
      var count = markRemindedEmails(d.emails || []);
      return json({ ok: true, marked: count });
    }

    // Otherwise: a normal registration → append a row.
    var sheet = getSheet(true);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Submitted At", "Type", "Name", "Email", "Phone", "Role", "Expectations"]);
    }
    sheet.appendRow([
      d.submittedAt || new Date().toISOString(),
      d.source || "", d.name || "", d.email || "",
      d.phone || "", d.role || "", d.expectations || "",
    ]);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/** Website → { action: "list", token } returns the registrant list as JSON. */
function doGet(e) {
  var params = (e && e.parameter) || {};
  if (params.action !== "list") return json({ ok: true, status: "alive" });
  if (!authorized(params.token)) return json({ ok: false, error: "unauthorized" });

  var registrants = collectRows().map(function (r) {
    return { name: r.name, email: r.email, type: r.type, remindedAt: r.remindedAt };
  });
  return json({ ok: true, registrants: registrants });
}

function authorized(token) {
  return CONFIG.API_TOKEN && String(token) === String(CONFIG.API_TOKEN);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}


// ========================= MANUAL REMINDER SENDERS =========================

/** ▶ STEP 1 — send ONE test email to yourself. */
function sendReminderTest() {
  GmailApp.sendEmail(CONFIG.TEST_EMAIL, "[TEST] " + CONFIG.SUBJECT, plainTextFallback("there"), {
    name: CONFIG.SENDER_NAME,
    htmlBody: buildReminderHtml("there"),
  });
  Logger.log("Test reminder sent to " + CONFIG.TEST_EMAIL);
}

/** ▶ STEP 2 — list recipients WITHOUT sending anything. */
function previewReminders() {
  var recipients = collectRecipients();
  Logger.log("Would send to " + recipients.length + " registrant(s):");
  recipients.forEach(function (r) {
    Logger.log("  • " + (r.name || "(no name)") + "  <" + r.email + ">");
  });
  if (!recipients.length) Logger.log("Nobody to send to. Check SHEET_NAME / ONLY_TYPE / rows.");
}

/** ▶ STEP 3 — send the reminder to everyone (marks each as reminded). */
function sendReminders() {
  var sheet = getSheet(false);
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
      Utilities.sleep(300);
    } catch (err) {
      failures.push(r.email + " — " + err);
    }
  });
  Logger.log("Reminder sent to " + sent + " of " + recipients.length + " registrant(s).");
  failures.forEach(function (f) { Logger.log("  ✗ " + f); });
  Logger.log("Gmail messages remaining today: " + MailApp.getRemainingDailyQuota());
}


// ============================== SHEET UTILS ================================

function getSheet(createIfMissing) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet && createIfMissing) sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('No sheet named "' + CONFIG.SHEET_NAME + '".');
  return sheet;
}

/** Every data row as { row, name, email, type, remindedAt }. */
function collectRows() {
  var sheet = getSheet(false);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var header = values[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var emailCol = idxOf(header, ["email", "email address"], 3);
  var nameCol = idxOf(header, ["name", "full name"], 2);
  var typeCol = idxOf(header, ["type", "source"], 1);
  var remindedCol = header.indexOf(CONFIG.REMINDED_HEADER.toLowerCase());

  var out = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    out.push({
      row: i + 1,
      name: String(row[nameCol] || "").trim(),
      email: String(row[emailCol] || "").trim().toLowerCase(),
      type: typeCol >= 0 ? String(row[typeCol] || "").trim() : "",
      remindedAt: remindedCol >= 0 ? row[remindedCol] : "",
    });
  }
  return out;
}

/** Rows filtered to those the manual sender should email. */
function collectRecipients() {
  var seen = {};
  return collectRows().filter(function (r) {
    if (!isValidEmail(r.email) || seen[r.email]) return false;
    if (CONFIG.ONLY_TYPE && r.type && r.type.toLowerCase() !== CONFIG.ONLY_TYPE.toLowerCase()) return false;
    if (CONFIG.SKIP_ALREADY_REMINDED && r.remindedAt) return false;
    seen[r.email] = true;
    return true;
  });
}

/** Stamp "Reminded At" for the given emails; returns how many were marked. */
function markRemindedEmails(emails) {
  var sheet = getSheet(false);
  var remindedCol = ensureRemindedColumn(sheet);
  var wanted = {};
  emails.forEach(function (em) { wanted[String(em).trim().toLowerCase()] = true; });
  var count = 0;
  collectRows().forEach(function (r) {
    if (wanted[r.email] && !r.remindedAt) {
      sheet.getRange(r.row, remindedCol).setValue(new Date());
      count++;
    }
  });
  return count;
}

function ensureRemindedColumn(sheet) {
  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (var i = 0; i < header.length; i++) {
    if (String(header[i]).trim().toLowerCase() === CONFIG.REMINDED_HEADER.toLowerCase()) return i + 1;
  }
  var col = sheet.getLastColumn() + 1;
  sheet.getRange(1, col).setValue(CONFIG.REMINDED_HEADER);
  return col;
}

function idxOf(header, candidates, fallback) {
  for (var i = 0; i < candidates.length; i++) {
    var idx = header.indexOf(candidates[i]);
    if (idx >= 0) return idx;
  }
  return fallback;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


// ============================== EMAIL BODY =================================

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

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
