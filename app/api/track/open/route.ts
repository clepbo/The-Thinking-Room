import { recordEvent } from "../../../lib/campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 1×1 transparent GIF.
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

/** Email open tracker. Loaded as an <img> in the email; logs a unique open. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const c = url.searchParams.get("c") || "";
  const e = url.searchParams.get("e") || "";
  if (c && e) {
    try {
      await recordEvent(c, decodeURIComponent(e), "open");
    } catch {
      /* never let tracking break the image */
    }
  }
  return new Response(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
    },
  });
}
