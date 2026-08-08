# SILVERO.925 — Security Checklist

Build against this from day one, not just before Phase 3 testing. Almost everything here is cheap to do while writing a feature and expensive to retrofit after — that's the whole point of this doc.

## 1. Authentication & Sessions
- [ ] Passwords hashed with bcrypt/argon2 via NextAuth — never store or log plaintext passwords
- [ ] Session cookies: `httpOnly`, `secure`, `sameSite: 'lax'` (NextAuth defaults to this — don't override)
- [ ] Rate-limit login attempts (e.g. 5 attempts per 15 min per IP/email) — prevents brute-force
- [ ] "Forgot password" tokens expire (e.g. 1 hour) and are single-use
- [ ] Admin login is a **separate, stronger** flow — different route, ideally 2FA, definitely not reachable via the same customer-facing form

## 2. Authorization (the #1 place beginner mistakes become real bugs)
- [ ] Every Circle-gated route/API re-checks `role === 'CIRCLE'` (or `'ADMIN'`, if admins should also see gated content) **server-side** — see `ARCHITECTURE.md` §"Membership Gating"
- [ ] Every account API scopes queries to the logged-in user's own ID — never trust a `userId` passed from the client (`/api/account/orders/[id]` must verify the order belongs to the requesting user, not just that *some* order with that ID exists)
- [ ] Admin routes check `role === 'ADMIN'` specifically — not just "logged in", and not just "not CUSTOMER" (a CIRCLE member is also not a plain customer, but isn't an admin)

## 3. Input Validation
- [ ] Validate every form server-side with a schema library (e.g. `zod`) — never rely on frontend validation alone (frontend checks are for UX, not security)
- [ ] Sanitize any user-generated text that gets rendered elsewhere (gift notes, custom order descriptions, reviews if added later) to prevent stored XSS
- [ ] Enforce field length limits server-side that match what the UI shows (e.g. gift note 200 char) — a client can send more than the UI allows
- [ ] **SQL injection:** covered by default as long as every DB query goes through Prisma's normal query methods (`prisma.product.findMany(...)`, etc.) — Prisma parameterizes these automatically. The only way to reintroduce the risk is `$queryRawUnsafe` or building raw SQL strings by hand — don't use either; if raw SQL is ever genuinely needed, use `$queryRaw` with tagged-template parameters, never string concatenation
- [ ] **CSRF:** NextAuth's session cookies default to `sameSite: 'lax'`, which blocks the classic cross-site form-submission attack — don't override this setting. For any state-changing API route, also confirm it only accepts `POST`/`PATCH`/`DELETE` (never allow a mutating action via `GET`, which bypasses this protection)
- [ ] **Security headers:** set `X-Frame-Options: DENY` (or `Content-Security-Policy: frame-ancestors 'none'`) to prevent clickjacking, and `Strict-Transport-Security` (HSTS) to force HTTPS on repeat visits — add these in `next.config.js` headers or at the Nginx level

## 4. File Uploads (Custom Order photos — the highest-risk feature in this build)
- [ ] Validate file type server-side by actual file signature, not just the extension/MIME type the browser reports
- [ ] Enforce max 5 files and a max file size per upload (e.g. 10MB each) server-side, not just in the UI
- [ ] Generate random filenames on save — never use the user-supplied filename directly (path traversal risk)
- [ ] Store uploads outside anywhere that could be executed (e.g. `public/uploads/custom-orders/`, served as static files only, never as a script path)
- [ ] Convert HEIC → JPG server-side (see `TECH_STACK.md`) — also doubles as a re-encode step that strips embedded metadata/EXIF (can leak location data otherwise)

## 5. Payments (Cashfree)
- [ ] **Never** mark an order "paid" from a frontend redirect/callback — only the verified webhook does this (see `ARCHITECTURE.md`)
- [ ] Verify the Cashfree webhook signature on every call — reject anything that doesn't match
- [ ] Cashfree keys (`CASHFREE_SECRET_KEY`, `CASHFREE_WEBHOOK_SECRET`) live only in `.env`, never in frontend code or committed to Git
- [ ] No card/UPI data ever touches your server — Cashfree's hosted checkout handles that, so you have no PCI-DSS scope as long as you don't build a custom card form

## 6. Stock & Order Integrity
- [ ] Stock decrement happens inside a DB transaction with row locking (`lib/stock.ts`) — see `ARCHITECTURE.md` for why
- [ ] Order totals are recalculated server-side at checkout from the DB's current product prices — never trust a total the client sends
- [ ] Coupon/discount logic (if added) is validated server-side, not applied client-side only

## 7. Infrastructure (cross-reference `HOSTING_HOSTINGER.md`)
- [ ] SSH: key-based login only, root login disabled, non-root deploy user
- [ ] Firewall: only 22 (SSH), 80/443 (web) open — Postgres (5432) never exposed publicly
- [ ] Cloudflare SSL mode: "Full (strict)" — not "Flexible" (Flexible leaves the Cloudflare-to-origin leg unencrypted)
- [ ] `.env` never committed — confirm `.gitignore` includes it before the first commit, not after
- [ ] Separate secrets for local/dev vs. production — a leaked dev key shouldn't compromise production

## 8. Dependencies
- [ ] Run `npm audit` periodically, patch high/critical vulnerabilities before launch
- [ ] Pin dependency versions in `package-lock.json` (default behavior — just don't `npm install` carelessly with `--force`)

## 9. Rate Limiting & Abuse Prevention
- [ ] Rate-limit form submissions that don't require login: Custom Order (already gated, but still), Corporate Lead form, Appointment booking, Newsletter signup — prevents spam/abuse
- [ ] Rate-limit the search API — an unthrottled search endpoint is an easy target for scraping/DoS

## 10. Logging & Monitoring
- [ ] Never log full request bodies for payment or auth routes (passwords, card tokens, webhook payloads may contain sensitive fields)
- [ ] Keep an audit trail for order status changes and Custom Order status changes (who/when) — useful for support disputes, not just security
- [ ] UptimeRobot + PM2 auto-restart (per `HOSTING_HOSTINGER.md`) double as basic incident detection

## 11. Pre-Phase-3 Self-Test (do this before the client's security testing phase)
- [ ] Try accessing `/account/circle/custom-order` while logged out → should redirect, not error or partially render
- [ ] Try calling `/api/circle/custom-order` directly (e.g. via Postman) without a session → should reject
- [ ] Try accessing another user's order via `/api/account/orders/[id]` with a guessed/incremented ID → should reject
- [ ] Try submitting checkout twice rapidly for the last unit of a product (simulate the race condition from the client's Q4) → only one should succeed
- [ ] Try uploading a `.php` or `.exe` file renamed to `.jpg` in the Custom Order form → should be rejected by signature check, not accepted because the extension looked right
- [ ] Confirm the site is unreachable over plain HTTP without redirecting to HTTPS

If all of these pass before you hand it to the client's Phase 3 review, that phase becomes confirmation, not discovery.
