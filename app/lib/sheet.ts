/**
 * Reads the raw registrant/subscriber list from the Google Sheet (via the Apps
 * Script web app). Returns null when it isn't configured. Shared by the
 * dashboard so we don't duplicate the fetch.
 */
export interface SheetRow {
  name?: string;
  email?: string;
  type?: string;
  remindedAt?: string;
}

export async function fetchSheetRegistrants(): Promise<SheetRow[] | null> {
  const base = process.env.SHEET_WEBHOOK_URL;
  const token = process.env.SHEET_API_TOKEN;
  if (!base || !token) return null;
  try {
    const url = `${base}${base.includes("?") ? "&" : "?"}action=list&token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; registrants?: SheetRow[] };
    if (!data.ok) return null;
    return data.registrants || [];
  } catch {
    return null;
  }
}
