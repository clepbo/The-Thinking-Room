# The Thinking Room — Project Context & Progress

> A living reference for **everything about this project**: what it is, what's
> built, how it fits together, the decisions behind it, and what's next.
> For step-by-step setup and deployment, see the [README](../README.md);
> this document is the map and the history.

_Last updated: 2026-08-23_

---

## 1. What this is

**The Thinking Room** is a virtual conversation series — a recurring event where
a host leads a live discussion on thinking clearly and living intentionally. This
repository is the event's **website + a full self-serve admin platform** for
running registrations and email marketing without any third-party ESP.

The current front-facing site is a single, cinematic landing page that announces
the current conversation and lets visitors reserve a seat. Behind it sits an
`/admin` area that has grown into a small CMS + email marketing suite:
registrations, reminders, a drag-free newsletter composer, scheduled batched
sends, open/click tracking, an unsubscribe list, and a charted dashboard.

### Direction / vision
- The site is being positioned to become **"The Austin Adetunji"** platform, with
  The Thinking Room as one recurring section (monthly conversations).
- Everything editable by a non-developer lives in **`app/content.ts`** so copy,
  dates, and links can change without touching components.

---

## 2. Current status (what's live)

| Area | Status |
| --- | --- |
| Landing page (hero, about, explore, audience, register, community, journal) | ✅ Built |
| Current event content — **Episode 3: "Living Your Life By Design"** with **The Austin Adetunji**, Fri **Aug 21, 2026**, **8:00 PM WAT**, virtual (Zoom) | ✅ Live in `content.ts` |
| Registration form → Google Sheet + owner email + registrant confirmation email | ✅ Built |
| Registration → WhatsApp community redirect + success screen | ✅ Built |
| Confirmation email (WhatsApp invite, **no Zoom link** — sent later by reminder) | ✅ Built |
| Reminder Console (`/admin`) + Google Sheet reminder path | ✅ Built |
| Events CMS (`/admin/events`) → publishes to `/events` (Supabase) | ✅ Built |
| Newsletter composer (`/admin/newsletter`) with rich text, images, files | ✅ Built |
| Scheduled campaigns + batched cron worker | ✅ Built |
| Email open/click tracking + failed-send visibility | ✅ Built |
| Charted admin Dashboard | ✅ Built |
| Unsubscribe flow (one-click, filtered from every send) | ✅ Built |
| Vercel Analytics | ✅ Enabled |
| Saved audiences | ⏳ Planned (next) |

> **Note:** Database-backed features (Events CMS, campaigns, tracking,
> unsubscribe) require Supabase env vars. Until those are set they **fail soft** —
> the site keeps working with static fallbacks and nothing errors.

---

## 3. Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** (strict).
- **No CSS framework** — a hand-written design system in `app/globals.css`
  (dark, editorial, red/lime-on-black). Icons are inline SVG (`components/Icons.tsx`).
- **Supabase** (`@supabase/supabase-js`) — server-only, via the secret key, RLS on.
- **Gmail SMTP via nodemailer** — all email sending (no ESP).
- **Google Sheets via Apps Script** (`apps-script/Code.gs`) — the durable
  registrations/journal list.
- **Vercel** — hosting, Cron, and **Vercel Analytics** (`@vercel/analytics`).
- Runtime deps are intentionally minimal: `next`, `react`, `react-dom`,
  `@supabase/supabase-js`, `nodemailer`, `@vercel/analytics`.

### Architecture at a glance

```
Visitor ── landing page (app/page.tsx, content from app/content.ts)
   │
   ├─ Register form ─► /api/register ─► Google Sheet (Apps Script)
   │                                  ├► owner notification email (Gmail)
   │                                  └► registrant confirmation email (Gmail)
   │                     └─ success screen ─► WhatsApp group redirect
   │
   └─ Journal signup ─► /api/register (source=journal) ─► Google Sheet

Admin (/admin, single token gate)
   ├─ Reminder Console ─► /api/send-reminders ─► Gmail (reads Sheet list)
   ├─ Events CMS       ─► /api/admin/events   ─► Supabase `events` ─► /events
   ├─ Newsletter       ─► /api/admin/schedule ─► Supabase `scheduled_campaigns`
   │                      /api/admin/upload    ─► Supabase `media`
   └─ Dashboard        ─► /api/admin/dashboard ─► Supabase (campaign stats)

Cron / background
   ├─ /api/cron/send    ─► processDueCampaigns() ─► batched Gmail sends
   │                       (tracking + unsubscribe filter applied here)
   └─ /api/cron/cleanup ─► expires old uploaded media (Vercel Cron, daily 03:00)

Tracking
   ├─ /api/track/open   ─► pixel  ─► Supabase `email_events` (unique) ─► bump count
   └─ /api/track/click  ─► logs + redirects ─► Supabase `email_events`

Unsubscribe
   └─ /unsubscribe (confirm) ─► /api/unsubscribe ─► Supabase `unsubscribes`
```

---

## 4. Features in detail

### 4.1 Landing page (`app/page.tsx`, `app/content.ts`)
Sections in order: Hero → About → Statement → Explore → Audience → Statement →
Details bar → **Register** → **Community (WhatsApp)** → Journal → Footer.
All text/dates/links come from `site` in `content.ts`.

### 4.2 Registration (`components/RegisterForm.tsx`, `app/api/register/route.ts`)
- Collects name, email, phone, role, expectations.
- POSTs to `/api/register`, which fans out (all best-effort, one failure never
  blocks the others): **Google Sheet**, **owner notification email**, and — for
  event registrants only — a **registrant confirmation email**.
- On success the form shows a WhatsApp success screen and **auto-opens the
  WhatsApp group** after ~2.5s (`window.location.href`, same tab to dodge popup
  blockers), with a visible fallback button.

### 4.3 Confirmation email (`app/api/register/route.ts` → `sendConfirmationEmail`)
- Confirms the seat, shows theme/date/time, an **Add to Google Calendar** link,
  and attaches an `.ics` file.
- **Deliberately omits the Zoom join link** — it can change before the event, so
  the correct link is sent later in a reminder. Instead the email carries a
  **"Join our community" WhatsApp button**.

### 4.4 Community section (`app/page.tsx`, `site.community`)
A WhatsApp band under the register form: badge, heading, blurb, and a green
"Join the WhatsApp group" CTA. Link is `site.register.whatsappUrl` (single source
of truth, reused by the success screen and the confirmation email).

### 4.5 Google Sheet integration (`apps-script/Code.gs`, `app/lib/sheet.ts`)
An Apps Script web app appends each signup as a row and exposes `list` /
`markReminded` actions (token-protected). This is the durable, browsable list of
registrants and journal subscribers.

### 4.6 Reminder Console (`/admin`, `app/api/send-reminders/route.ts`)
Send a reminder to everyone on the sheet, filtered by audience (event / journal /
all), with a live preview, single-test send, dry run, and editable Zoom details.
Sends are de-duped and now also **skip unsubscribed addresses**. Large lists are
better served by the Apps Script `sendReminders` (no serverless timeout).

### 4.7 Events CMS (`/admin/events`, `app/lib/events.ts`, Supabase `events`)
Create/edit/publish events that render on `/events`. Falls back to static content
when Supabase isn't configured.

### 4.8 Newsletter composer (`/admin/newsletter`)
Block-based email builder (`app/lib/campaign.ts`): heading, text (rich), image,
button, video (→ clickable thumbnail), file, divider, spacer. Renders email-safe
table HTML + a plain-text fallback. Live preview fills `{{firstName}}` and strips
`{{unsubscribeUrl}}`. Recipients can be pulled from the sheet (with
check/uncheck) or entered manually.

### 4.9 Scheduled + batched sending (`app/lib/campaigns.ts`, `/api/cron/send`)
Campaigns are queued in `scheduled_campaigns` with a send time. The cron worker
`processDueCampaigns()`:
1. On first pickup, snapshots the recipient list (from explicit list or audience),
   **filters out unsubscribed addresses**, flips status to `sending`.
2. Sends in batches of 20 within a ~40s budget, persisting a `cursor` so a later
   run resumes — so large lists complete without a Vercel 504.
3. Records `sent_count` / `failed_count` and a `failures[]` list per campaign.

### 4.10 Email open/click tracking (`/api/track/*`, Supabase `email_events`)
`injectTracking()` fills `{{unsubscribeUrl}}` per recipient, appends a 1×1 open
pixel, and rewrites `http(s)` links through `/api/track/click` (skipping the
unsubscribe + track links). Events are deduped by a unique
`(campaign_id, email, type)` constraint and roll up via the `bump_campaign` RPC.
Needs `SITE_URL` for absolute links; without it, emails still send untracked.

### 4.11 Unsubscribe (`/unsubscribe`, `/api/unsubscribe`, Supabase `unsubscribes`)
Every newsletter footer links to `/unsubscribe?e=<email>`. The page shows a
**confirm** step, then POSTs to `/api/unsubscribe` (POST-only, so GET
prefetchers/scanners can't opt anyone out). Opted-out addresses are filtered from
the campaign worker, the reminder console, and "Load from sheet." Fails soft with
a `mailto:` fallback when Supabase/`SITE_URL` is unset.

### 4.12 Dashboard (`/admin/dashboard`)
Overview of campaigns with hand-rolled inline-SVG charts (donut + bars). Palette
is CVD-safe and validated: green `#3fa564` (opens/journal), blue `#5a86e0`
(clicks/event), red `#e0564f` (failed).

### 4.13 Admin shell & auth (`app/admin/AdminShell.tsx`, `auth.tsx`)
A single token gate (`ADMIN_TOKEN`) protects the whole `/admin` area. The token
is held in `sessionStorage` + React context; pages read it via `useAdminToken()`
and pass it to the protected APIs. Auth once, switch tabs freely.

### 4.14 Media uploads & auto-cleanup (`/api/admin/upload`, `/api/cron/cleanup`)
Images/files uploaded for newsletters live in Supabase `media` and are expired by
a daily Vercel Cron (`MEDIA_TTL_DAYS`, default configured in code).

---

## 5. Data model (Supabase — `supabase/schema.sql`)

Run the whole file in the Supabase SQL Editor; everything is
`create table if not exists`, so re-running is safe. RLS is enabled on every
table (the server uses the secret key).

| Table | Purpose |
| --- | --- |
| `events` | Events CMS records rendered on `/events`. |
| `media` | Uploaded newsletter assets, with an expiry for auto-cleanup. |
| `scheduled_campaigns` | Queued/sending/sent newsletters — recipients snapshot, `cursor`, `sent_count`, `failed_count`, `failures[]`, `opened_count`, `clicked_count`. |
| `email_events` | One row per unique open/click `(campaign_id, email, type)`. |
| `unsubscribes` | `email` (PK) + `created_at`; filtered from all sends. |

Plus the `bump_campaign(cid, col)` function that increments a campaign's
opened/clicked counters.

---

## 6. Environment variables (complete reference)

Set these in **Vercel → Settings → Environment Variables**. Secrets must never be
committed to the repo.

| Variable | Used for | Required for |
| --- | --- | --- |
| `ADMIN_TOKEN` | Gate for the whole `/admin` area + protected APIs | Admin features |
| `GMAIL_USER` | Gmail address used as SMTP sender | Any email |
| `GMAIL_APP_PASSWORD` | Gmail app password | Any email |
| `NOTIFY_EMAIL` | Where owner "new signup" notifications go | Owner alerts |
| `SHEET_WEBHOOK_URL` | Apps Script web-app URL (write + list) | Google Sheet |
| `SHEET_API_TOKEN` | Must match the Apps Script `API_TOKEN` | Sheet list/mark |
| `SUPABASE_URL` | Supabase project URL | Events/campaigns/tracking/unsubscribe |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` server-only key | same as above |
| `SITE_URL` | Absolute site URL for tracking pixel/links & unsubscribe | Tracking + one-click unsubscribe |
| `ZOOM_LINK` | Meeting URL, used by the **reminder** email | Reminders |
| `ZOOM_MEETING_ID` | Optional; auto-parsed from `ZOOM_LINK` if omitted | Reminders |
| `ZOOM_PASSCODE` | Optional passcode | Reminders |
| `CRON_SECRET` | Bearer token guarding `/api/cron/send` | Scheduled sends |
| `MEDIA_TTL_DAYS` | Days before uploaded media is auto-deleted | Upload cleanup |
| `VERCEL_PROJECT_PRODUCTION_URL` | Auto-set by Vercel; fallback for `SITE_URL` | (automatic) |

WhatsApp group link and all front-end copy live in `app/content.ts`, not env vars.

---

## 7. Scheduling / cron

- **`vercel.json`** schedules the media cleanup only:
  `/api/cron/cleanup` daily at `03:00`.
- **`/api/cron/send`** (the campaign worker) is auth'd by
  `Authorization: Bearer <CRON_SECRET>` (or the admin token). On Vercel **Hobby**,
  Cron is limited to daily; to send on a schedule more granular than that, either
  upgrade to **Pro** or drive `/api/cron/send` from an external pinger
  (e.g. cron-job.org) using the `CRON_SECRET`.

---

## 8. Key design decisions

- **No ESP — Gmail SMTP.** Sending from a Gmail account avoids the verified-custom-
  domain requirement of Resend/SendGrid on a `*.vercel.app` domain, at the cost of
  Gmail's ~500 emails/day cap (fine for a seat-limited event).
- **Batched cron sending.** Serverless functions time out (~60s); batching with a
  persisted cursor lets arbitrarily large lists finish across runs.
- **Fail-soft everywhere.** Missing Supabase / Gmail / Sheet config degrades to
  static fallbacks and logging instead of user-facing errors.
- **Confirmation email omits the join link.** The link can change; the reminder
  email carries the correct one closer to the event.
- **Unsubscribe is a POST-confirm, not a GET link**, so email scanners/prefetchers
  can't opt people out by accident.
- **All editable content in one file** (`app/content.ts`) for non-developer edits.
- **Charts are hand-rolled inline SVG** with a CVD-safe, lightness-validated
  palette — no chart library.

---

## 9. Known constraints & gotchas

- **Build sandbox can't reach Supabase** (`*.supabase.co` is blocked by the build
  proxy). DB features are built and fallback-tested locally, then live-verified on
  Vercel where the env vars and network exist.
- **Vercel Hobby cron = daily only** (see §7).
- **Open rates are approximate** — Apple Mail Privacy Protection inflates opens and
  some clients block images; **clicks are the more reliable signal**.
- **Secrets stay in Vercel env vars**, never in the repo. If a key is ever pasted
  into a shared chat, rotate it.

---

## 10. Repository map

```
app/
  content.ts            ← ALL editable copy, dates, links (start here)
  page.tsx              ← landing page composition
  layout.tsx            ← fonts, metadata, Vercel Analytics
  globals.css           ← the whole design system
  founder/ tadcircle/   ← standalone pages
  events/               ← public events listing (Supabase-backed)
  unsubscribe/          ← confirm page + client
  api/
    register/           ← form handler (Sheet + emails + confirmation)
    send-reminders/     ← Reminder Console endpoint
    unsubscribe/        ← opt-out endpoint
    track/open|click/   ← email open/click tracking
    cron/send|cleanup/  ← campaign worker + media expiry
    admin/…             ← events, schedule, upload, dashboard, campaigns
  admin/                ← admin shell, auth, dashboard, events, newsletter
  lib/
    supabase.ts         ← server client (secret key, null when unconfigured)
    eventEmail.ts       ← shared reminder email builders
    campaign.ts         ← newsletter block → email HTML renderer
    campaigns.ts        ← campaign data layer + cron worker + tracking
    events.ts           ← events data layer
    sheet.ts            ← Google Sheet fetch helper
    unsubscribe.ts      ← unsubscribe set + add
components/             ← Nav, Footer, forms, Icons, Reveal, Statement
supabase/schema.sql     ← all tables + RLS + bump_campaign()
apps-script/Code.gs     ← Google Sheet web app (write, list, markReminded, reminders)
assets/ public/         ← brand imagery, logos, hero photo
docs/PROJECT_CONTEXT.md ← this document
README.md               ← setup & deployment guide
vercel.json             ← cron schedule (media cleanup)
```

---

## 11. History (commit milestones)

Newest first — the shape of how the platform grew:

- Swap Zoom for WhatsApp in confirmation email; add homepage community section.
- Add unsubscribe flow, WhatsApp registration redirect, Episode 3 homepage.
- Add email open/click tracking, failed-send visibility, charted dashboard.
- Newsletter: manual email entry + check/uncheck pulled recipients.
- Add scheduled newsletter sending (queue + cron worker).
- Add rich-text editor + file uploads with auto-expiry cleanup.
- Add admin sidebar shell + Dashboard (auth once, switch tabs freely).
- Add Supabase-backed Events CMS (manage events → publish to `/events`).
- Make Zoom details editable in the Reminder Console.
- Add newsletter/digest composer and Vercel Analytics.
- Fix bulk-send 504 with batched sending + combined de-duped audience.
- Add `/admin` Reminder Console.
- Add website reminder endpoint + consolidate Apps Script.
- Website redesign + email flows; separate Founder and TADCircle pages.

---

## 12. Roadmap / next steps

- **Saved audiences** — named, reusable recipient lists stored in the DB
  (next planned feature).
- Reposition toward the **"The Austin Adetunji"** platform with The Thinking Room
  as a monthly section.
- Continue CMS coverage so new events/episodes can be published end-to-end
  without code edits.

---

_This document is intended to be kept current. When a feature ships, update
§2 (status), §4 (details), and §11 (history)._
