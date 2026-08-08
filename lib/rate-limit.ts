// Minimal in-memory sliding-window rate limiter — no Redis in TECH_STACK.md
// (single VPS, free-tools-only), so this is deliberately simple: fine for a
// single PM2 process, resets on restart/deploy, won't work across multiple
// app instances. Revisit if the app ever scales beyond one process.
const buckets = new Map<string, number[]>();

/**
 * @param key identifier to limit by, e.g. `login:${email}` or `search:${ip}`
 * @param limit max attempts allowed within the window
 * @param windowMs window size in ms
 * @returns true if the request is allowed, false if it should be rejected (429)
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    buckets.set(key, timestamps);
    return false;
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  return true;
}

// Periodic cleanup so the map doesn't grow unbounded over a long-running process.
setInterval(
  () => {
    const now = Date.now();
    for (const [key, timestamps] of buckets) {
      const fresh = timestamps.filter((t) => now - t < 60 * 60 * 1000);
      if (fresh.length === 0) buckets.delete(key);
      else buckets.set(key, fresh);
    }
  },
  10 * 60 * 1000,
).unref?.();

/** Best-effort client identifier from request headers (behind Cloudflare/Nginx). */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? "unknown";
}
