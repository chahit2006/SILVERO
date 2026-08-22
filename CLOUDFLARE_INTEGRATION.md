# CLOUDFLARE_INTEGRATION.md — SILVERO.925

> Companion to `HOSTING_HOSTINGER.md` and `SECURITY_CHECKLIST.md`. Read those
> two first — this doc assumes the Hostinger VPS + Nginx + Next.js setup
> they describe is already standing, and layers Cloudflare in front of it.
> Maps to **Phase 3** of the delivery plan (security testing + hosting).

---

## 1. What Cloudflare is doing here, and why

SILVERO's finalized architecture already names Cloudflare as DNS/CDN/WAF in
front of the Hostinger VPS. This doc turns that into five concrete jobs:

| Job | Problem it solves |
|---|---|
| **DNS + reverse proxy** | Hides the VPS's real IP from the public internet — the origin is only reachable through Cloudflare |
| **TLS termination** | Free, auto-renewing edge certificates; VPS only needs one origin cert, not public-facing cert management |
| **WAF + rate limiting** | Protects the OTP/login flow and checkout from abuse — this is unaddressed today (no cron on abandoned stock-locks is a related known gap) |
| **Bot mitigation** | Turnstile on the OTP, Custom Order upload, and contact forms — all three are currently open to scripted abuse |
| **Edge caching** | Serves static assets and product images from Cloudflare's edge instead of hitting the single VPS every time |

**Hard constraint carried over from the commercial terms: free plugins/apps
only, no paid API keys.** Every item in this doc is scoped to the
**Cloudflare Free plan**. Section 2 draws that line explicitly so nothing
gets half-adopted and later found to be a paid feature.

---

## 2. Free plan scope — what's in, what's out

| Feature | Free plan? | Use it? |
|---|---|---|
| DNS, universal SSL, CDN | ✅ Free | Yes — core of this doc |
| WAF managed rules (OWASP core ruleset) | ✅ Free (reduced ruleset vs paid) | Yes |
| 5 custom Firewall/WAF rules | ✅ Free | Yes — see §6 |
| Rate limiting rules | ✅ Free (limited rule count) | Yes — see §6 |
| Bot Fight Mode | ✅ Free | Yes |
| Turnstile (CAPTCHA replacement) | ✅ Free, unlimited | Yes — see §7 |
| Cache Rules (3 free rules) | ✅ Free | Yes — see §8 |
| Under Attack Mode | ✅ Free | Yes, situational — see §9 |
| Cloudflare Tunnel (`cloudflared`) | ✅ Free | Optional — see §10 |
| Argo Smart Routing | ❌ Paid | **Not used** |
| Load Balancing | ❌ Paid | **Not used** |
| Image resizing / Polish | ❌ Paid | **Not used** — Next.js's own image optimization on the VPS covers this |
| Advanced/unlimited Rate Limiting rules | ❌ Paid tier | Stay within the free rule count (§6) |

If a future need genuinely requires a paid feature, flag it to the client as
a new recurring cost decision — don't adopt it silently.

---

## 3. Phase A — DNS cutover

1. Add the domain as a site in Cloudflare (Free plan).
2. Recreate existing DNS records (`A` for apex + `www`, any `MX`/`TXT` for
   email) — copy exactly from the current registrar/host before changing
   nameservers, so nothing breaks mid-cutover.
3. Set the `A` record(s) pointing at the Hostinger VPS to **Proxied**
   (orange cloud) — this is what makes Cloudflare sit in front of the
   origin rather than just resolving DNS.
4. Update nameservers at the domain registrar to Cloudflare's assigned pair.
5. Wait for propagation (can take up to 24h) before proceeding to §4.
6. **Do not cut over during a client-visible demo window** — coordinate
   timing so this doesn't collide with a phase-review meeting.

---

## 4. Phase B — TLS

1. SSL/TLS mode: **Full (strict)** — not "Flexible." Flexible only encrypts
   Cloudflare—visitor, leaving Cloudflare—VPS in plaintext, which is wrong
   for a site handling checkout and OTP codes.
2. Generate a Cloudflare **Origin Certificate** (free, 15-year validity) and
   install it in Nginx on the VPS, replacing whatever cert is there now.
3. Enable **Always Use HTTPS** and **Automatic HTTPS Rewrites**.
4. Set minimum TLS version to 1.2.
5. Enable **HSTS** only after confirming every subdomain in use is served
   over HTTPS — misconfigured HSTS is hard to undo quickly.

---

## 5. Phase C — restore real client IPs in Nginx

**This step is easy to skip and breaks things silently if skipped.** Once
Cloudflare proxies traffic, Nginx sees Cloudflare's IP as the client IP for
every request — which breaks rate limiting, OTP abuse detection, and
activity/audit logging (all of which need the *real* visitor IP).

1. Add Cloudflare's published IP ranges to Nginx as trusted proxies
   (`set_real_ip_from` for each Cloudflare IPv4/IPv6 block).
2. Set `real_ip_header CF-Connecting-IP;` — Cloudflare's header carries the
   real visitor IP.
3. Verify: hit the site from two different networks and confirm the
   Next.js app (server logs / any request-logging middleware) records two
   different IPs, not Cloudflare's.
4. Anywhere the app currently does its own rate limiting or abuse
   detection using `req.ip` or `x-forwarded-for` directly, confirm it now
   reads the corrected real IP, not Cloudflare's.

---

## 6. Phase D — WAF, firewall rules, rate limiting

Within the 5 free custom-rule budget, prioritize:

| Priority | Rule | Why |
|---|---|---|
| 1 | Rate-limit `/api/auth/otp*` (or equivalent OTP request/verify routes) | OTP request-spam is the most concrete abuse vector already in the codebase — no server-side rate limit exists today per known gaps |
| 2 | Rate-limit login attempts | Same class of risk on password login |
| 3 | Rate-limit checkout/order-creation endpoint | Protects the stock-lock mechanism from being hammered — relevant given the known gap that abandoned pending orders aren't released by a cron yet |
| 4 | Block/challenge requests to `/admin*` from outside expected patterns | Admin panel is being built now — worth gating at the edge in addition to app-level RBAC |
| 5 | Managed WAF ruleset (OWASP core) — enable at default sensitivity | Baseline coverage against common injection/exploit patterns, no custom authoring needed |

Enable **Bot Fight Mode** (free, separate from the 5-rule budget) to cut
down on scraper/basic-bot traffic against the storefront generally.

---

## 7. Phase E — Turnstile on forms

Add Cloudflare Turnstile (free, unlimited) to:

- OTP request form (login/signup) — the highest-value target, since this is
  a new, unrate-limited flow per current known gaps
- Custom Order photo-upload form
- Contact form (currently `mailto:`, so this can be added whenever the
  planned `ContactMessage` model + real submission handler is built)

Turnstile requires a site key + secret key from the Cloudflare dashboard —
store the secret key as a VPS environment variable, never in the repo,
consistent with `SECURITY_CHECKLIST.md`'s existing rule against committed
secrets.

---

## 8. Phase F — caching

Within the 3 free Cache Rule budget:

| Priority | Rule | Cache behavior |
|---|---|---|
| 1 | `_next/static/*` and other build-hashed assets | Cache aggressively (these are content-hashed, safe to cache long) |
| 2 | Product images served from VPS disk via Nginx | Cache at the edge — this is the highest-traffic static content on the site |
| 3 | Everything under `/api/*`, `/cart`, `/checkout`, `/account*` | **Bypass cache entirely** — these are session-specific and must never be served stale or to the wrong visitor |

Get the bypass list right before the cache list — a wrongly-cached
session-specific response (e.g. someone else's cart or account page) is a
much worse failure than a slow page load.

---

## 9. Under Attack Mode

Free-plan feature, situational — not part of the standard rollout. Document
it here so it's known rather than discovered mid-incident:

- Toggles an interstitial JS challenge in front of the entire site
- Use only during an active, confirmed attack/scrape spike
- Turn off again once traffic normalizes — it adds friction for every real
  visitor while active

---

## 10. Optional — Cloudflare Tunnel

Free (`cloudflared`), not required for the core plan. Instead of exposing
the VPS's public IP at all (even behind proxy DNS), a tunnel creates an
outbound-only connection from the VPS to Cloudflare, so no inbound port
needs to be open on the VPS.

**Trade-off:** adds an extra moving piece (the `cloudflared` daemon must
stay running and be monitored — tie into the existing UptimeRobot setup if
adopted) for a security benefit that Full-strict TLS + WAF + firewall rules
already substantially cover. Treat as a "nice to have if time allows in
Phase 3," not a blocker for launch.

---

## 11. App-level changes required

| Change | File/area | Why |
|---|---|---|
| Trust Cloudflare's IP ranges as proxy source | Nginx config | §5 |
| Read `CF-Connecting-IP` for real client IP anywhere `req.ip`/`x-forwarded-for` is used today | Any rate-limiting/logging code | §5 |
| Turnstile site key as public env var, secret key as server-only env var | `.env` on VPS | §7 |
| Verify Turnstile token server-side on OTP/upload/contact submit | API routes for those forms | §7 — a client-side-only check is not real protection |
| Confirm no app code assumes it can read the "true" origin IP without the Cloudflare header | Any existing security/audit logging | §5 |

---

## 12. Rollout checklist (Phase 3)

1. [ ] DNS records recreated and verified in Cloudflare before nameserver change
2. [ ] Nameservers updated, propagation confirmed
3. [ ] SSL/TLS mode set to Full (strict), origin cert installed
4. [ ] Real-IP restoration verified with a two-network test
5. [ ] 5 firewall rules configured per §6 priority order
6. [ ] Bot Fight Mode enabled
7. [ ] Turnstile live on OTP, Custom Order upload, and contact forms, verified server-side
8. [ ] 3 cache rules configured, bypass list tested first
9. [ ] Confirm checkout, OTP login, and admin panel all still work end-to-end through the proxy before treating this as done
10. [ ] Document the Cloudflare account credentials/2FA recovery per the client hand-off process (non-technical client — this needs to be as simple as the rest of the hand-off docs)

---

## 13. Rollback

If DNS cutover causes an outage: revert nameservers to the previous
registrar-set values. Propagation delay on rollback is the same as on
cutover (up to 24h) — this is why §3 step 6 says not to do this near a
client demo.

---

## 14. Codebase reconciliation (added 2026-08-14, on adding this doc to the repo)

Verified §5/§6/§7/§11 against the live code. Three corrections — the doc
above is left as written; these are the deltas:

1. **§6 priority 1 and §7 both say the OTP flow is "unrate-limited" / "no
   server-side rate limit exists today." That is not accurate.**
   `app/api/auth/mfa/request-otp/route.ts:35` already calls
   `rateLimit('mfa-otp:${email}', 5, 15 * 60 * 1000)`, and
   `app/api/auth/register/route.ts`, `/api/search`, `/api/appointments`,
   `/api/gift-cards/[code]` and `/api/circle/custom-order` are all rate
   limited too (`lib/rate-limit.ts`). Cloudflare rate limiting is still
   worth adding as a second, edge-level layer — the in-memory limiter
   resets on deploy and is per-process — but it is not filling a void.

2. **§5 step 4 has a live hit, and it is a real bug, not just a config
   note.** `getClientIp()` in `lib/rate-limit.ts:41-45` reads
   `x-forwarded-for` **first** and only falls back to `cf-connecting-ip`.
   Behind Cloudflare that ordering is backwards: `X-Forwarded-For` is
   attacker-supplied unless Nginx overwrites it, so a client that sends a
   different `X-Forwarded-For` on each request gets a fresh rate-limit
   bucket every time and bypasses every IP-keyed limit above. Must be
   inverted (prefer `CF-Connecting-IP`) as part of this rollout.

3. **§4 step 5 (HSTS):** `next.config.js` already emits
   `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   at the app level. The "enable HSTS only after confirming every subdomain
   is HTTPS" caution therefore already applies **today**, before any
   Cloudflare toggle — confirm subdomain coverage, or narrow that header.

Also note: §7's contact-form item is still blocked on the `ContactMessage`
model, which does not exist (`BUILD_STATUS.md` flagged gap — `/contact` is
`mailto:`). Turnstile there is unbuildable until that lands.
