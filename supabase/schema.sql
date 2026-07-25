-- ============================================================================
--  THE THINKING ROOM — SUPABASE SCHEMA
-- ============================================================================
--  How to run: Supabase dashboard → SQL Editor → New query → paste this whole
--  file → Run. Safe to run more than once (uses "if not exists").
--
--  The website reads/writes these tables from the SERVER using the secret key,
--  which bypasses Row Level Security. RLS is still enabled below, with a public
--  read policy only for PUBLISHED events (so nothing private is ever exposed if
--  you later read from the browser).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- events (CMS)
create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  edition         text,
  tagline         text,
  description     text,
  starts_at       timestamptz,
  location        text,
  cover_image_url text,
  link_url        text,
  status          text not null default 'draft'
                  check (status in ('draft', 'published')),
  is_featured     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists events_status_idx on public.events (status);
create index if not exists events_starts_at_idx on public.events (starts_at desc);

alter table public.events enable row level security;

-- Anyone may read PUBLISHED events; drafts and all writes require the secret key.
drop policy if exists "published events are public" on public.events;
create policy "published events are public"
  on public.events for select
  using (status = 'published');

-- ------------------------------------------------------------ media (uploads)
-- Tracks files uploaded from the admin (images + documents) so they can be
-- auto-deleted after they expire (see /api/cron/cleanup) and never fill storage.
create table if not exists public.media (
  id          uuid primary key default gen_random_uuid(),
  path        text not null,              -- storage object path
  url         text not null,              -- public URL
  kind        text not null default 'file',
  bytes       bigint,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz                 -- null = never auto-delete
);
create index if not exists media_expires_idx on public.media (expires_at);

alter table public.media enable row level security;
-- No public policies: uploads/reads happen server-side with the secret key.

-- Uploaded files live in a Storage bucket named "media". The upload route
-- creates it automatically (public) on first use, so no manual step is needed.

-- ------------------------------------------------- scheduled_campaigns (send)
-- A newsletter queued to go out at a future time. A cron worker picks these up,
-- snapshots the recipient list, and sends in batches across runs (tracking
-- progress with `cursor`), so big lists never time out.
create table if not exists public.scheduled_campaigns (
  id           uuid primary key default gen_random_uuid(),
  subject      text not null,
  html         text not null,
  body_text    text,
  audience     text not null default 'all',   -- 'event' | 'journal' | 'all'
  scheduled_at timestamptz not null,
  status       text not null default 'scheduled'
               check (status in ('scheduled', 'sending', 'sent', 'canceled', 'error')),
  recipients   jsonb,          -- [{email,name}] snapshot, filled at send time
  total        int not null default 0,
  cursor       int not null default 0,   -- next recipient index to send
  sent_count   int not null default 0,
  failed_count int not null default 0,
  last_error   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  started_at   timestamptz,
  completed_at timestamptz
);
create index if not exists sched_status_idx on public.scheduled_campaigns (status, scheduled_at);

alter table public.scheduled_campaigns enable row level security;
-- No public policies: managed server-side with the secret key.

-- ============================================================================
--  (Coming next: email_events for open/click tracking.)
-- ============================================================================
