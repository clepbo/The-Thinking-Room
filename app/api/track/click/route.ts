import { NextResponse } from "next/server";
import { recordEvent } from "../../../lib/campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Email click tracker. Logs a unique click, then redirects to the real URL. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const c = url.searchParams.get("c") || "";
  const e = url.searchParams.get("e") || "";
  const u = url.searchParams.get("u") || "";

  let target = "";
  try {
    target = decodeURIComponent(u);
  } catch {
    target = u;
  }
  if (!/^https?:\/\//i.test(target)) {
    target = process.env.SITE_URL || "/";
  }

  if (c && e) {
    try {
      await recordEvent(c, decodeURIComponent(e), "click", target);
    } catch {
      /* redirect regardless */
    }
  }
  return NextResponse.redirect(target, 302);
}
