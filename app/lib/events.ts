import { getSupabase } from "./supabase";

/**
 * Events data layer. Every function fails soft: if Supabase isn't configured or
 * a query errors, reads return [] / null and writes return an error string,
 * so the site never crashes because of the database.
 */

export interface EventRecord {
  id?: string;
  slug: string;
  title: string;
  edition: string | null;
  tagline: string | null;
  description: string | null;
  starts_at: string | null; // ISO timestamp
  location: string | null;
  cover_image_url: string | null;
  link_url: string | null;
  status: "draft" | "published";
  is_featured: boolean;
  created_at?: string;
  updated_at?: string;
}

const TABLE = "events";

/** Published events, newest event date first — for the public website. */
export async function listPublishedEvents(): Promise<EventRecord[]> {
  const db = getSupabase();
  if (!db) return [];
  const { data, error } = await db
    .from(TABLE)
    .select("*")
    .eq("status", "published")
    .order("starts_at", { ascending: false, nullsFirst: false });
  if (error) {
    console.error("[events] listPublished failed:", error.message);
    return [];
  }
  return (data as EventRecord[]) || [];
}

/** All events including drafts — for the admin CMS. */
export async function listAllEvents(): Promise<EventRecord[]> {
  const db = getSupabase();
  if (!db) return [];
  const { data, error } = await db.from(TABLE).select("*").order("updated_at", { ascending: false });
  if (error) {
    console.error("[events] listAll failed:", error.message);
    return [];
  }
  return (data as EventRecord[]) || [];
}

export async function getEventBySlug(slug: string): Promise<EventRecord | null> {
  const db = getSupabase();
  if (!db) return null;
  const { data, error } = await db.from(TABLE).select("*").eq("slug", slug).maybeSingle();
  if (error) {
    console.error("[events] getBySlug failed:", error.message);
    return null;
  }
  return (data as EventRecord) || null;
}

/** Create or update an event (matched by id when present, else by slug). */
export async function upsertEvent(
  event: Partial<EventRecord>
): Promise<{ ok: true; event: EventRecord } | { ok: false; error: string }> {
  const db = getSupabase();
  if (!db) return { ok: false, error: "Supabase is not configured." };

  const row = { ...event, updated_at: new Date().toISOString() };
  const { data, error } = await db
    .from(TABLE)
    .upsert(row, { onConflict: event.id ? "id" : "slug" })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, event: data as EventRecord };
}

export async function deleteEvent(id: string): Promise<{ ok: boolean; error?: string }> {
  const db = getSupabase();
  if (!db) return { ok: false, error: "Supabase is not configured." };
  const { error } = await db.from(TABLE).delete().eq("id", id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Turn a title into a URL-safe slug. */
export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
