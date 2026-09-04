import { getSupabase } from "./supabase";
import { describeFetchError } from "./http";

/**
 * The unsubscribe list. Emails here are filtered out of every send. Fails soft:
 * if Supabase isn't configured, the set is empty (nobody is filtered).
 */

export async function getUnsubscribedSet(): Promise<Set<string>> {
  const db = getSupabase();
  if (!db) return new Set();
  try {
    const { data, error } = await db.from("unsubscribes").select("email");
    if (error) {
      console.error("[unsubscribe] query failed:", error.message);
      return new Set();
    }
    return new Set((data || []).map((r) => String(r.email).toLowerCase()));
  } catch (err) {
    // Network-level failure reaching Supabase (undici "fetch failed").
    console.error("[unsubscribe] fetch failed:", describeFetchError(err));
    return new Set();
  }
}

export async function addUnsubscribe(email: string): Promise<{ ok: boolean; error?: string }> {
  const db = getSupabase();
  if (!db) return { ok: false, error: "Supabase is not configured." };
  const clean = email.trim().toLowerCase();
  const { error } = await db.from("unsubscribes").upsert({ email: clean }, { onConflict: "email" });
  return error ? { ok: false, error: error.message } : { ok: true };
}
