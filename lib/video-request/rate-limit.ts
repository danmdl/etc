/**
 * Minimal fixed-window rate limiter, no external dependencies.
 *
 * State lives in the memory of a single serverless instance, so this is a
 * best-effort guard against bursts and casual abuse, not a global limit.
 * For a hard guarantee, swap in Vercel KV / Upstash or a Vercel Firewall rule.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 5; // per IP per window
const MAX_TRACKED_KEYS = 5_000; // memory ceiling

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, now = Date.now()): { allowed: boolean; retryAfterSec: number } {
  const entry = hits.get(key);

  if (!entry || entry.resetAt <= now) {
    if (hits.size >= MAX_TRACKED_KEYS) prune(now);
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

function prune(now: number) {
  for (const [key, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(key);
  }
  // Still full (sustained flood from many IPs): drop the oldest entries.
  if (hits.size >= MAX_TRACKED_KEYS) {
    const overflow = hits.size - MAX_TRACKED_KEYS + 1;
    let i = 0;
    for (const key of hits.keys()) {
      if (i++ >= overflow) break;
      hits.delete(key);
    }
  }
}

/** Best-effort client IP from Vercel's proxy headers. */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
