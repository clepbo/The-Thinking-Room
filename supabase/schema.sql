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

-- ============================================================================
--  (Coming next: subscribers, campaigns, and email_events for the dashboard
--   and open/click tracking. They'll be added here when we build that phase.)
-- ============================================================================
