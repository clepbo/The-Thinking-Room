/**
 * Resilient wrapper around the built-in `fetch`.
 *
 * Node's global `fetch` (undici) throws a bare `TypeError: fetch failed` for
 * every low-level network problem — DNS failure, connection refused, timeout,
 * TLS error — and hides the real reason inside `error.cause`. That opaque
 * message is what surfaces in the admin UI when a newsletter broadcast can't
 * reach the Google Sheet (Apps Script) or Supabase, with no clue as to why.
 *
 * `fetchWithRetry` fixes both problems:
 *   - it aborts a request that hangs past `timeoutMs` (so a stuck Apps Script
 *     call can't burn the whole serverless budget),
 *   - it retries transient failures (network error / 429 / 5xx) with backoff,
 *   - and on final failure it throws an Error whose message includes the
 *     unwrapped `cause`, e.g. "Loading recipients failed: getaddrinfo
 *     ENOTFOUND script.google.com" instead of just "fetch failed".
 */

/** Pull the human-readable reason out of a thrown fetch error (unwraps `cause`). */
export function describeFetchError(err: unknown): string {
  if (err instanceof Error) {
    const cause = (err as { cause?: unknown }).cause;
    if (cause instanceof Error && cause.message) {
      const code = (cause as { code?: string }).code;
      return code ? `${cause.message} (${code})` : cause.message;
    }
    if (cause && typeof cause === "object") {
      const c = cause as { code?: string; message?: string };
      if (c.message) return c.code ? `${c.message} (${c.code})` : c.message;
      if (c.code) return c.code;
    }
    if (err.name === "AbortError") return "request timed out";
    return err.message || String(err);
  }
  return String(err);
}

interface RetryOptions {
  timeoutMs?: number;
  retries?: number;
  /** Prefix for the thrown error, e.g. "Loading recipients". */
  label?: string;
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  { timeoutMs = 15_000, retries = 2, label }: RetryOptions = {}
): Promise<Response> {
  const prefix = label ? `${label} failed` : "Request failed";
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      // Retry transient server-side statuses; return everything else as-is so
      // the caller can inspect res.ok / res.status.
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        lastErr = new Error(`${prefix}: HTTP ${res.status}`);
        await backoff(attempt);
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      // A caller-supplied signal that aborts (not our timeout) shouldn't retry.
      if (init.signal?.aborted) break;
      if (attempt < retries) {
        await backoff(attempt);
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(`${prefix}: ${describeFetchError(lastErr)}`);
}

function backoff(attempt: number): Promise<void> {
  // 400ms, 800ms, 1600ms …
  return new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
}
