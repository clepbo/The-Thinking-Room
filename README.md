# The Thinking Room

A cinematic, single-page website for **The Thinking Room** — a modern
intellectual platform — built to announce the current conversation and let
visitors reserve a seat.

Built with **Next.js** (App Router) + TypeScript. Dark, editorial, gold-on-black
aesthetic. No external image files, no CSS framework, no runtime dependencies
beyond React/Next — so it's fast and nothing can break from a broken link.

---

## Table of contents

1. [Run it on your computer](#1-run-it-on-your-computer)
2. [Edit the content](#2-edit-the-content-the-only-file-you-usually-touch)
3. [Deploy to Vercel — step by step](#3-deploy-to-vercel-step-by-step)
4. [Make the registration form email you](#4-make-the-registration-form-email-you-optional-but-recommended)
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

## 4. Make the registration form email you (optional but recommended)

Out of the box, form submissions are recorded in your **Vercel logs**
(Project → Logs), so the form works immediately. To also get an **email** for
every registration:

1. Sign up free at **https://resend.com** and get an API key. (To send from your
   own domain, verify it in Resend; to just test, you can send from their
   `onboarding@resend.dev` address.)
2. In Vercel: **Project → Settings → Environment Variables**, add:

   | Name             | Value                                             |
   | ---------------- | ------------------------------------------------- |
   | `RESEND_API_KEY` | your Resend API key                               |
   | `NOTIFY_EMAIL`   | where you want registrations sent (your inbox)    |
   | `FROM_EMAIL`     | a verified sender, e.g. `hello@thethinkingroom.co`|

3. **Redeploy** (Vercel → Deployments → ⋯ → Redeploy). Done — each signup now
   lands in your inbox.

Prefer Google Sheets, Mailchimp, or Airtable instead? See the comments in
**`app/api/register/route.ts`** — swap the delivery call for that service's API.

---

## 5. Project structure

```
app/
  content.ts        ← ALL editable text, dates, and links live here
  layout.tsx        ← fonts + page metadata (SEO title, favicon)
  globals.css       ← the design system (colors, type, layout)
  page.tsx          ← assembles the sections into the page
  api/register/
    route.ts        ← handles form submissions
components/
  Nav.tsx           ← top navigation (with mobile menu)
  Icons.tsx         ← all inline SVG icons
  Reveal.tsx        ← fade-in-on-scroll animation
  RegisterForm.tsx  ← the "Reserve Your Seat" form
  JournalForm.tsx   ← the newsletter signup
```

---

Made for The Thinking Room — *Conversations That Create Clarity.*
