import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client (uses the SECRET key — never expose this to the
 * browser). Returns null when the env vars aren't set, so the site keeps
 * working (with static fallbacks) until Supabase is configured.
 *
 * Required env vars (set in Vercel → Settings → Environment Variables):
 *   SUPABASE_URL         e.g. https://xxxx.supabase.co
 *   SUPABASE_SECRET_KEY  the sb_secret_… key (server only)
 */
let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  cached = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return cached;
}

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}
