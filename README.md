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
| **Email**        | An email per signup                       | Optional (Resend) |
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

### 4b. Email per signup (optional)

Want an email in your inbox for each registration too? Add these environment
variables in Vercel (uses [Resend](https://resend.com), free tier):

| Name             | Value                                             |
| ---------------- | ------------------------------------------------- |
| `RESEND_API_KEY` | your Resend API key                               |
| `NOTIFY_EMAIL`   | where you want registrations sent (your inbox)    |
| `FROM_EMAIL`     | a verified sender, e.g. `hello@thethinkingroom.co`|

Redeploy, and each signup also lands in your inbox. You can use the Sheet, the
email, or both — whatever's set up gets a copy.

### 4c. Auto-reply to the person who registered (confirmation email)

As soon as someone submits the "Reserve Your Seat" form, they can get an
automatic reply confirming their seat with the event's **date, time, and Zoom
link** — no manual work on your end. (Journal signups don't get this; it's
just for event registrations.)

1. You need `RESEND_API_KEY` and `FROM_EMAIL` set (see 4b above — `NOTIFY_EMAIL`
   is not required for this one).
2. Add one more environment variable with your real Zoom (or Google Meet /
   Teams) link:

   | Name        | Value                                              |
   | ----------- | --------------------------------------------------- |
   | `ZOOM_LINK` | your meeting URL, e.g. `https://zoom.us/j/123456789` |

   > Why an environment variable and not `app/content.ts`? `content.ts` is
   > bundled into the page everyone's browser downloads, so anything you put
   > there is visible to anyone who views the page source — even people who
   > never registered. An environment variable stays on the server and is
   > only ever used inside the email that's sent to someone *after* they
   > register.

3. Redeploy. From then on, every registrant gets an email like:

   > **You're In, [Name].**
   > Your seat for The Thinking Room is confirmed.
   > **Date:** *(pulled live from `app/content.ts`)*
   > **Time:** *(pulled live from `app/content.ts`)*
   > **Zoom Link:** *(your `ZOOM_LINK`)*

   The date and time always match what's on the site — edit them in
   `app/content.ts` under `details` and the confirmation email picks it up
   automatically, no code changes needed.

If `ZOOM_LINK` isn't set yet, the email still sends (confirming the date and
time) with a line saying the link will follow in a reminder — so you can turn
this on before you have the final Zoom link and fill it in later.

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
components/
  Nav.tsx           ← top navigation (with mobile menu)
  Icons.tsx         ← all inline SVG icons
  Reveal.tsx        ← fade-in-on-scroll animation
  RegisterForm.tsx  ← the "Reserve Your Seat" form
  JournalForm.tsx   ← the newsletter signup
public/
  logo.png            ← the wordmark used in the nav + footer
  hero-portrait.webp  ← the photo in the hero section
```

---

Made for The Thinking Room — *Conversations That Create Clarity.*
