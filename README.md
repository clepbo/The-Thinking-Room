# The Thinking Room

A cinematic, single-page website for **The Thinking Room** — a modern
intellectual platform — built to announce the current conversation and let
visitors reserve a seat.

Built with **Next.js** (App Router) + TypeScript. Dark, editorial, red-and-lime-
on-black aesthetic. No CSS framework, no runtime dependencies beyond
React/Next — so it's fast. The logo and hero photo live in `public/` as plain
image files (see [Project structure](#5-project-structure)).

---

## Table of contents

1. [Run it on your computer](#1-run-it-on-your-computer)
2. [Edit the content](#2-edit-the-content-the-only-file-you-usually-touch)
3. [Deploy to Vercel — step by step](#3-deploy-to-vercel-step-by-step)
4. [Where does the form data go?](#4-where-does-the-form-data-go-how-to-access-registrations-anytime)
5. [Project structure](#5-project-structure)

---

## 1. Run it on your computer

You need [Node.js](https://nodejs.org) 18.18+ installed (this project was built
with Node 22). Then, in a terminal, from this folder:

```bash
npm install     # first time only — downloads dependencies
npm run dev     # starts the local dev server
```

Open **http://localhost:3000** in your browser. Edit any file and the page
reloads automatically.

To preview the real production build locally:

```bash
npm run build
npm start
```

---

## 2. Edit the content (the only file you usually touch)

**`app/content.ts`** holds every word, date, link, and event detail on the site:
the headline, the "What We Explore" cards, "Who This Is For", the Date / Time /
Zoom / Duration bar, the footer email and social links, and so on.

Change the text inside the quotes and save — that's it. You do **not** need to
touch any of the design or layout files.

> ⚠️ **Note:** the flyer's date reads *Saturday, June 22, 2024*, which is in the
> past. Update the `details` section in `app/content.ts` to the correct date and
> time before going live.

To change colors, fonts, or spacing, edit the variables at the top of
**`app/globals.css`** (look for `:root { ... }`).

---

## 3. Deploy to Vercel (step by step)

Vercel is free for a project like this and is made by the same team as Next.js,
so it "just works."

### Step 1 — Put the code on GitHub

This project already lives in a Git repository. Push it to GitHub if you
haven't:

```bash
git add .
git commit -m "The Thinking Room website"
git push
```

(If you're reading this in the repo Claude created, the code is already pushed to
your branch — you can merge it to `main` on GitHub, or just point Vercel at the
branch in Step 3.)

### Step 2 — Create a Vercel account

1. Go to **https://vercel.com/signup**.
2. Click **Continue with GitHub** and authorize Vercel. This lets Vercel see
   your repositories.

### Step 3 — Import the project

1. On your Vercel dashboard, click **Add New… → Project**.
2. Find **`the-thinking-room`** (or whatever your repo is named) in the list and
   click **Import**.
3. Vercel auto-detects Next.js. **Leave every setting at its default** —
   Framework Preset: *Next.js*, Build Command: *`next build`*, Output: handled
   automatically.
4. Click **Deploy**.

Wait about a minute. Vercel builds the site and gives you a live URL like
`https://the-thinking-room.vercel.app`. 🎉

### Step 4 — Automatic updates

From now on, **every time you push to GitHub, Vercel redeploys automatically.**
Edit `app/content.ts`, commit, push — your live site updates in ~1 minute.

### Step 5 — (Optional) Add your own domain

In your Vercel project: **Settings → Domains → Add**, type your domain (e.g.
`thethinkingroom.co`), and follow the DNS instructions Vercel shows you.

---

## 4. Where does the form data go? (how to access registrations anytime)

Every submission (both the "Reserve Your Seat" form and the Journal signup) is
sent to the site's handler at `app/api/register/route.ts`, which delivers it to
**any of the channels below that you've set up**:

| Channel          | What you get                              | Setup      |
| ---------------- | ----------------------------------------- | ---------- |
| **Google Sheet** | A live spreadsheet — every signup a row   | Recommended (below) |
| **Email**        | An email per signup                       | Optional (your own Gmail account) |
| **Vercel logs**  | A raw log entry (safety net)              | Always on, no setup |

The Vercel log is only a fallback — it's hard to browse and old entries scroll
away. **For a list you can open and search anytime, set up the Google Sheet.**

### 4a. Google Sheet — the list you can open anytime (recommended)

This gives you a spreadsheet where every registration appears as a new row —
name, email, phone, role, and what they're hoping to get. No API keys, no
billing. About 5 minutes:

1. Go to **https://sheets.new** to create a new Google Sheet. Name it anything
   (e.g. "Thinking Room Registrations").
2. In the menu: **Extensions → Apps Script**. A code editor opens in a new tab.
3. Delete whatever's there and paste this in, then click the **Save** (💾) icon:

   ```javascript
   function doPost(e) {
     try {
       var ss = SpreadsheetApp.getActiveSpreadsheet();
       var sheet = ss.getSheetByName('Registrations') || ss.insertSheet('Registrations');

       if (sheet.getLastRow() === 0) {
         sheet.appendRow(['Submitted At', 'Type', 'Name', 'Email', 'Phone', 'Role', 'Expectations']);
       }

       // Accept a JSON body (from the site) or plain form params.
       var d = {};
       if (e && e.postData && e.postData.contents) {
         d = JSON.parse(e.postData.contents);
       } else if (e && e.parameter) {
         d = e.parameter;
       }

       sheet.appendRow([
         d.submittedAt || new Date().toISOString(),
         d.source || '', d.name || '', d.email || '',
         d.phone || '', d.role || '', d.expectations || ''
       ]);

       return ContentService
         .createTextOutput(JSON.stringify({ ok: true }))
         .setMimeType(ContentService.MimeType.JSON);
     } catch (err) {
       return ContentService
         .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
         .setMimeType(ContentService.MimeType.JSON);
     }
   }

   // ▶ To test from the editor, select this function and click Run — it feeds
   //   doPost a fake submission so a row should appear in your sheet.
   //   (Running doPost directly always errors, because it expects a real
   //    web request — that's normal, not a bug.)
   function testDoPost() {
     doPost({ postData: { contents: JSON.stringify({
       name: 'Test Person', email: 'test@example.com', phone: '+234000',
       role: 'Founder', expectations: 'Just testing', source: 'Event registration'
     }) } });
   }
   ```

   > ⚠️ **Seeing `Cannot read properties of undefined (reading 'postData')`?**
   > That happens when you press **Run** on `doPost` itself — it has no request
   > to read. Run **`testDoPost`** instead (pick it from the function dropdown
   > next to Run), or just test with a real form submission after step 7.

4. Click **Deploy → New deployment**. Click the ⚙️ gear, choose **Web app**.
   - **Execute as:** *Me*
   - **Who has access:** *Anyone*
   - Click **Deploy**, then **Authorize access** and approve the permission
     prompts (it's your own script writing to your own sheet).
5. Copy the **Web app URL** it gives you (it starts with
   `https://script.google.com/macros/s/…/exec`).
6. In Vercel: **Project → Settings → Environment Variables**, add:

   | Name                | Value                                   |
   | ------------------- | --------------------------------------- |
   | `SHEET_WEBHOOK_URL` | the Web app URL you just copied         |

7. **Redeploy** (Vercel → Deployments → ⋯ → Redeploy).

Done. Submit a test registration — a row appears in your sheet instantly. Open
that sheet from your phone or laptop anytime to see everyone who registered.

> If you ever change the Apps Script, click **Deploy → Manage deployments →
> ✏️ Edit → Version: New version** so the changes go live (the URL stays the same).

### 4b. Email per signup, via your own Gmail account (optional)

Both the owner-notification email (this section) and the registrant
confirmation email (4c below) send through **your own Gmail account** using
Nodemailer + Gmail SMTP — not a transactional email API like Resend or
SendGrid.

> **Why Gmail and not Resend/SendGrid?** Those services require you to prove
> you own the domain you're sending from (via DNS records) before they'll
> deliver to arbitrary recipients. If your site is still on the default
> `*.vercel.app` domain, you don't control its DNS, so it can never be
> verified — every send would fail with something like *"the gmail.com
> domain is not verified"* or a 403. Sending through your own Gmail account
> sidesteps that entirely, since you're authenticating as yourself, not
> claiming to be a domain. The tradeoff is Gmail's own sending limit (about
> 500 emails/day on a regular account) — far more than a seat-limited event
> needs. **If you later buy a custom domain**, switching to Resend/SendGrid
> with a verified domain is a better long-term choice (better deliverability,
> higher limits) — ask your dev to swap it in.

**Setup (~5 minutes):**

1. On the Gmail account you want to send from, turn on **2-Step Verification**
   if it isn't already: **[myaccount.google.com/security](https://myaccount.google.com/security) → 2-Step Verification**.
2. Generate an **App Password**: **[myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)**
   → name it something like "The Thinking Room" → copy the 16-character
   password it gives you. (This is different from your normal Gmail
   password — it's a one-time-shown password just for this app.)
3. In Vercel: **Project → Settings → Environment Variables**, add:

   | Name                 | Value                                          |
   | -------------------- | ----------------------------------------------- |
   | `GMAIL_USER`         | the Gmail address you're sending from            |
   | `GMAIL_APP_PASSWORD` | the 16-character App Password from step 2        |
   | `NOTIFY_EMAIL`       | where you want registration notifications sent (can be the same address, or different) |

4. **Redeploy** (Vercel → Deployments → ⋯ → Redeploy — env vars only take
   effect on deployments created *after* you add them).

Once that's done, you get an email for every signup, and you can use the
Sheet, the email, or both.

### 4c. Auto-reply to the person who registered (confirmation email)

As soon as someone submits the "Reserve Your Seat" form, they get an
automatic reply confirming their seat with the event's **date, time, Zoom
link, Meeting ID, Passcode, and a calendar invite** — no manual work on your
end. (Journal signups don't get this; it's just for event registrations.)

1. You need `GMAIL_USER` and `GMAIL_APP_PASSWORD` set (see 4b above —
   `NOTIFY_EMAIL` is not required for this one).
2. Add these environment variables with your real Zoom (or Google Meet /
   Teams) details:

   | Name              | Value                                                | Required? |
   | ----------------- | ----------------------------------------------------- | --------- |
   | `ZOOM_LINK`       | your meeting URL, e.g. `https://zoom.us/j/123456789`   | Yes |
   | `ZOOM_MEETING_ID` | e.g. `818 8668 7384`                                   | No — auto-parsed from `ZOOM_LINK` if you skip it |
   | `ZOOM_PASSCODE`   | the numeric passcode Zoom shows in your invite         | No — Zoom doesn't put this in the URL, so there's nothing to parse; leave it out and that line is just skipped |

   > Why environment variables and not `app/content.ts`? `content.ts` is
   > bundled into the page everyone's browser downloads, so anything you put
   > there is visible to anyone who views the page source — even people who
   > never registered. Environment variables stay on the server and are only
   > ever used inside the email that's sent to someone *after* they register.

3. Redeploy. From then on, every registrant gets an email with:
   - The date and time — computed from `site.event.startISO` in
     `app/content.ts`, so it's always correct. If you ever change the event's
     date/time, update **both** `details` (what's shown on the page) and
     `event.startISO` (what the email/calendar invite uses) — there's a
     comment right above it in `content.ts` as a reminder.
   - The Zoom link, Meeting ID, and Passcode (whichever you've set).
   - An **"Add to Google Calendar"** button, plus a `.ics` file attached to
     the email so it also works with Outlook, Apple Calendar, and anything
     else that reads calendar files.

If `ZOOM_LINK` isn't set yet, the email still sends (confirming the date and
time) with a line saying the link will follow in a reminder — so you can turn
this on before you have the final Zoom link and fill it in later.

### 4d. Testing that email actually works

1. Set all four env vars from 4b/4c above in Vercel, then **redeploy** —
   this step gets missed most often, and env vars never apply retroactively
   to a deployment built before you added them.
2. Submit a real test registration on the live site.
3. Check **Vercel → your project → Logs** (or the "Runtime Logs" tab) for
   lines starting with `[the-thinking-room]`. Every delivery channel logs
   exactly what happened:
   - `... skipped — missing GMAIL_USER/GMAIL_APP_PASSWORD` → the env vars
     aren't set (or weren't set at deploy time — redeploy).
   - `... failed: Error: ...` → the actual error from Gmail, printed in full.
   - `... sent` / `sent to <email>` → it worked. Check spam if it's not in
     the inbox.

---

## 4e. Send a reminder email to everyone who registered

There are two ways to do this. **The Apps Script way is simplest and works
today with no redeploy — use it unless you specifically want the endpoint.**

### 4e-i. From your Google Sheet (recommended — nothing to deploy)

**`apps-script/Code.gs`** is the complete script for your sheet. It handles new
registrations, the reminder senders, *and* (optionally) the website endpoint
below — all in one file.

1. Open your sheet → **Extensions → Apps Script**. Select all, delete, and paste
   the entire contents of **`apps-script/Code.gs`**. Save.
2. Fill in the `CONFIG` block at the top (Zoom link/ID/passcode, date, time, and
   a `TEST_EMAIL` — your own address).
3. **Re-publish** so the site keeps working: **Deploy → Manage deployments →
   ✏️ Edit → Version: New version → Deploy.** (The web-app URL stays the same.)
4. Run the reminder functions in order (pick each from the function dropdown,
   click **Run**; approve the Gmail permission the first time):
   - **`sendReminderTest`** → sends one copy to your `TEST_EMAIL`. Eyeball it.
   - **`previewReminders`** → sends nothing; **View → Logs** shows exactly who
     would receive it, and how many.
   - **`sendReminders`** → sends to everyone. Each person is stamped in a
     **"Reminded At"** column, so a second run won't email them again.

Gmail allows ~500 emails/day from a normal account (2,000/day on Workspace) —
plenty for a seat-limited event. The script logs your remaining quota after it runs.

### 4e-ii. From the website — the Reminder Console page (`/admin`)

Go to **`https://YOUR-SITE/admin`** for a full page where you can **edit the
reminder, preview it live, send yourself a test, and send to everyone** — no
terminal, no Apps Script editor. This is the friendliest option for repeat use.

**Setup (one time):**

1. Make sure `apps-script/Code.gs` is pasted into your sheet (4e-i) and set a
   long random `API_TOKEN` in its `CONFIG`, then re-publish.
2. In Vercel → **Settings → Environment Variables**, add:

   | Name              | Value                                                   |
   | ----------------- | ------------------------------------------------------- |
   | `ADMIN_TOKEN`     | a long random secret — this is the console's password   |
   | `SHEET_API_TOKEN` | the **same** value as `CONFIG.API_TOKEN` in Code.gs     |

   (`GMAIL_USER`, `GMAIL_APP_PASSWORD`, `ZOOM_LINK`, and `SHEET_WEBHOOK_URL` are
   already set from earlier steps.) **Redeploy.**
3. Open `/admin`, enter your `ADMIN_TOKEN`, and you're in. Edit the subject,
   headline, and paragraphs; the preview on the right updates as you type.
   `{{firstName}}`, `{{date}}`, `{{time}}`, and `{{edition}}` are filled in per
   person. Send a test to yourself, then **Load recipients → Send**. Everyone
   sent is marked in the sheet's "Reminded At" column so they won't be emailed
   twice.

The page is unlisted (not in search engines) and every action requires the
token, which is checked on the server.

> **Prefer the command line?** The same endpoint works with `curl` — e.g.
> `curl -X POST https://YOUR-SITE/api/send-reminders -H "x-admin-token: TOKEN"
> -H "Content-Type: application/json" -d '{"test":"you@example.com"}'`. Body
> options: `{ test, dryRun, resend, content, recipients }`.

For very large lists the Apps Script way (4e-i) is more reliable, since the
website is bound by the serverless request timeout.

---

## 4f. Newsletter / digest composer (`/admin/newsletter`)

A block-based editor for newsletters and updates — reached from the "Newsletter"
link in the Reminder Console, or directly at `/admin/newsletter` (same admin
token).

- **Blocks**: heading, text, image, button, video, file, divider, spacer. Add,
  reorder (↑/↓), and delete.
- **Text blocks** have a real formatting toolbar — bold, italic, underline,
  bulleted/numbered lists, alignment, font family, and size, plus links. Type
  `{{firstName}}` anywhere to personalise per recipient.
- **Image / File uploads**: upload straight from your computer (images, and
  documents like PDF/Word) — click "Upload image"/"Upload file". Files go to
  Supabase Storage and are auto-deleted after they expire (see below), so
  storage never fills up. You can still paste a URL instead.
- **Video**: email clients can't play video, so a video block becomes a
  clickable thumbnail that opens the link (YouTube thumbnails are automatic).
- **Light or dark** theme, live preview, send-a-test, and the same audience
  picker + **batched sending** as the reminder console (so no 504).

### Uploads & auto-cleanup

Uploads need Supabase (the same `SUPABASE_URL` + `SUPABASE_SECRET_KEY`). The
upload route creates a public Storage bucket named `media` automatically. Each
file is recorded with an expiry and **auto-deleted by a daily cron** (configured
in `vercel.json` → `/api/cron/cleanup`), so old media is cleared for you.

Optional env vars:

| Name             | Value                                                      |
| ---------------- | ---------------------------------------------------------- |
| `MEDIA_TTL_DAYS` | Days a file lives before auto-delete (default **90**; `0` = never) |
| `CRON_SECRET`    | Set this and Vercel Cron authenticates the cleanup call    |

(Server-proxied uploads are capped at ~4 MB per file; larger-file support via
direct-to-storage can be added later.)

### Sending in batches (why the 504 happened, and the fix)

Both consoles now send in **batches of ~12 per request** straight from your
browser, showing a live delivered/failed count. Each request finishes quickly,
so it never hits Vercel's timeout. Keep the tab open until it completes. (True
background/queued sending, plus **open & click tracking**, comes with the
Supabase phase — see below.)

---

## Website analytics

`@vercel/analytics` is wired into the site (`app/layout.tsx`). After you deploy,
enable **Analytics** in your Vercel project dashboard to see visits, page views,
top pages, and referrers. No code changes needed.

---

## Events CMS (Supabase) — setup

The **Events CMS** lets you create events in the dashboard and publish them to
the website at **`/events`**. It's built on Supabase. To turn it on:

1. **Run the schema.** In your Supabase project → **SQL Editor** → paste the
   whole of **`supabase/schema.sql`** → **Run**. (Safe to re-run.)
2. **Add env vars** in Vercel → Settings → Environment Variables (server-side —
   never put the secret key in code):

   | Name                  | Value                                  |
   | --------------------- | -------------------------------------- |
   | `SUPABASE_URL`        | your project URL (`https://….supabase.co`) |
   | `SUPABASE_SECRET_KEY` | the `sb_secret_…` key                  |

   `ADMIN_TOKEN` (already set) also gates the CMS.
3. **Redeploy.** Then open **`/admin/events`**, enter your admin token, and
   create an event. "Save & publish" makes it appear on `/events`.

Until Supabase is configured, `/events` simply shows "No events published yet"
and the CMS reports that it isn't connected — the rest of the site is unaffected.

> **Security:** the secret key is server-only and bypasses row-level security.
> Keep it in Vercel env vars, never in the repo. If it's ever exposed, rotate it
> in the Supabase dashboard.

## The admin (`/admin`)

All admin tools live behind one login now. Enter your `ADMIN_TOKEN` **once** at
`/admin`, then use the **left sidebar** to move between tabs — no re-auth:

- **Reminders** — the reminder console (edit, preview, batched send).
- **Newsletter** — the block-based newsletter/digest composer.
- **Events CMS** — create/publish events to `/events`.
- **Dashboard** — audience numbers (from the Google Sheet), event counts (from
  Supabase), and where email/site tracking is headed. Site visits/page views are
  in **Vercel → Analytics**.

### Still to come (next Supabase steps)

- **Email open/click tracking** per campaign (tracking pixel + redirect links
  logged to Supabase), surfaced on the Dashboard.
- **Saved audiences & an unsubscribe list** stored in the database.

---

## 5. Project structure

```
app/
  content.ts        ← ALL editable text, dates, and links live here
  layout.tsx        ← fonts + page metadata (SEO title, favicon)
  globals.css       ← the design system (colors, type, layout)
  page.tsx          ← assembles the sections into the page
  api/register/
    route.ts        ← handles form submissions + the confirmation email
  api/send-reminders/
    route.ts        ← protected endpoint to email all registrants a reminder
  admin/
    page.tsx        ← the /admin Reminder Console (compose, preview, send)
    AdminConsole.tsx
    newsletter/     ← the /admin/newsletter composer (block editor + send)
  lib/
    campaign.ts     ← turns newsletter blocks into email-safe HTML
    eventEmail.ts   ← shared email helpers + the reminder email template
components/
  Nav.tsx           ← top navigation (with mobile menu)
  Icons.tsx         ← all inline SVG icons
  Reveal.tsx        ← fade-in-on-scroll animation
  RegisterForm.tsx  ← the "Reserve Your Seat" form
  JournalForm.tsx   ← the newsletter signup
public/
  logo.png            ← the wordmark used in the nav + footer
  hero-portrait.webp  ← the photo in the hero section
apps-script/
  Code.gs             ← the complete Google Sheet script (registrations,
                        reminder senders, and the endpoint's read/mark API)
```

---

Made for The Thinking Room — *Conversations That Create Clarity.*
