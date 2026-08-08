# SILVERO.925 — Build Status

Snapshot as of 2026-08-08. Keep this updated as work continues — it's the fastest way for anyone (human or AI) to answer "where are we?" without re-reading the whole session history.

## Done

### Phase 1 — Foundation + Storefront
- Next.js 14 / TypeScript / Tailwind scaffold, Prisma schema, global components (Header, Footer, SearchOverlay)
- Homepage — all 12 sections (`DESIGN_SYSTEM.md` §5)
- Full Shop — 17 routes on one shared `ProductListingPage` component (5 special views + Nar/Nari hubs + 10 sub-categories)
- Product detail drawer pattern (no standalone PDP, per PRD)
- Cart — server-persisted, guest cookie merges into account on login
- Auth — NextAuth credentials, real register/login/session, bcrypt hashing
- Account shell — dashboard, orders+tracking, invoices, returns, wishlist, recently-viewed, addresses, payments (shell), circle (shell then, now real), referrals, loyalty, preferences (shell)
- 9 guide pages (shared template) + all static/about/search pages

### Phase 2 — Core Commerce
- `lib/stock.ts` — the one stock-lock transaction (`SELECT...FOR UPDATE`, row-locked, deadlock-safe ordering)
- Cashfree integration — REST API directly (not the official SDK, which silently pulls in `@sentry/node`)
- Shiprocket integration — rates + shipment creation, graceful fallback when unconfigured
- `/checkout` (3-step: Contact → Shipping → Payment) + `/order/[id]/confirmation`
- Real server-side total recalculation, never trusts client-sent prices

### Phase 2 — Circle + Custom Order
- Free-via-past-purchase and paid Circle membership (paid path reuses the Cashfree flow)
- Server-side membership gating, independently re-checked at the API layer
- Custom Order form — HEIC→JPEG conversion, magic-byte file validation (not extension/MIME), random filenames, 5-file/10MB limits
- Public `/circle` landing + `/circle/custom-order` entry (built for real, since Circle itself is the feature)

### Phase 2 — Gifting
- Gift cards — digital/physical, preset+custom amounts, real Cashfree payment flow
- Registry — create, public share-link view, guest purchase (goes through **real** checkout + webhook, not a fake "mark purchased" button)
- 4 gifting guides + hub, wrapping page, build-your-gift bundler

### Admin Panel — step 1 of the `ADMIN_PANEL_SPEC.md` §8 priority order
- `Role` enum (`CUSTOMER`/`CIRCLE`/`ADMIN`) + `User.role` — applied to `prisma/schema.prisma`, migration `20260808140000_admin_role`, backfills existing Circle members to `CIRCLE`
- `requireAdmin()` / `getAdminOrNull()` in `lib/auth.ts` — role read from the DB per request (never from the JWT, so promote/demote takes effect immediately), `=== "ADMIN"` exactly, non-admins redirected to `/account` and API routes answer 404
- `prisma/promote-admin.ts` — promotes an existing account; no code path anywhere creates an admin with a password
- `/admin/orders` (list, filter by status, counts) + `/admin/orders/[id]` (items, customer, shipping, payment, shipment, manual status update)
- `/api/admin/orders` + `/api/admin/orders/[id]` (GET, PATCH status) — each re-checks admin independently of the page gate
- Transition rules live only in `lib/admin-orders.ts`; `PENDING`/`PAID` are unreachable from any admin request (webhook-only, CLAUDE.md #6)
- **Not yet built:** `/admin` dashboard, `/admin/products`, and the four queues — awaiting sign-off before starting

**Total: 75 pages, 28 API routes, 175 source files. Every stage verified against a real seeded local Postgres — not just build-clean — including a genuinely signed Cashfree webhook payload for the payment-confirmation paths.**

## Not done

**Explicitly skipped (your call, undocumented-phase items):** Quiz, Compare, Build-Your-Stack, Appointments, Corporate/Bulk, standalone `/shop-the-look` and `/unboxing` pages.

> **Update 2026-08-08:** these 5 are now speced in `FEATURE_SPEC_BATCH2.md` and moving into active development. Quiz was replaced with advanced PLP filters per client direction; standalone `/shop-the-look` and `/unboxing` remain cut.

**Phase 3, not started:** full QA pass, security review of gated/payment flows, Hostinger deployment, monitoring setup, handover.

**Flagged gaps from along the way** (each has a comment at its source citing this):
| Gap | Where | Why it's not done |
|---|---|---|
| No cron job to release stock on abandoned (never-webhooked) `PENDING` orders | `ARCHITECTURE.md` | Needs a scheduled job (cron / `node-cron` in PM2) — real gap before trusting inventory counts |
| `CIRCLE_JOIN_FEE` = ₹499 | `lib/circle.ts` | Placeholder — `PRD.md` explicitly says confirm real pricing with the client |
| No transactional email provider | forgot-password, Custom Order confirmation, gift card delivery | Free-tools-only constraint means this needs a deliberate pick (e.g. Resend/Brevo free tier), not an invented integration |
| Contact form uses `mailto:` | `/contact` | No `ContactMessage` model exists; didn't want a fake "message sent" that silently discards input |
| Preferences page not persisted | `/account/preferences` | No schema field for marketing consent yet |
| 2 high-severity `npm audit` findings | Next 14.2.35's bundled deps | No 14.x patch available yet; didn't jump to Next 15/16 unilaterally |
| Cashfree/Shiprocket never tested against real credentials | `lib/cashfree.ts`, `lib/shiprocket.ts` | Written from API knowledge, verify against live docs before first real sandbox test |
| Brand hex colors, hero CTA style, body font | `DESIGN_SYSTEM.md` §10 | Sampled placeholders — get real values from the client/designer |
| Placeholder product photography | `prisma/seed.ts`, `public/placeholders/` | No real photography exists yet |
| "As Seen In" press logos | `components/home/AsSeenIn.tsx` | Unverified — don't ship without confirming real press mentions |
| ~~No admin role/panel~~ | — | Closed 2026-08-08 — `ADMIN_PANEL_SPEC.md` written, role gate + `/admin/orders` built (see above) |
| Cancelling an order doesn't restock it | `app/api/admin/orders/[id]/route.ts` | Stock movement belongs only in `lib/stock.ts` (CLAUDE.md #4) — pairs with the abandoned-order stock-release cron gap above, fix both together |
| No `Order.paymentStatus` | `ADMIN_PANEL_SPEC.md` §2/§4 vs `DATA_MODEL.md` | Spec assumes a field that doesn't exist; payment is derived from `OrderStatus` in `lib/admin-orders.ts` and can't tell a cancelled-unpaid order from a cancelled-refunded one |
| `recharts` not installed | `package.json` | `ADMIN_PANEL_SPEC.md` §2 says it's "already in your allowed frontend libraries" — it isn't in `package.json`; needs adding before the dashboard charts |

## How to run

> **Correction 2026-08-08:** the paragraph below described one particular machine and no longer
> matches a fresh checkout. `node_modules/`, `.env` and `.env.local` are all gitignored, so a new
> clone needs `npm install` and its own env files before anything runs. The Postgres service
> present is **18**, not 17, and the `silvero` / `silvero_dev_pw` credentials below did not
> authenticate against it — treat them as the intended convention, not as working values.

Everything is already set up in this environment — Postgres is running as a Windows service, seeded, and the dev server is live right now at **http://localhost:3000**.

```bash
# If you need to start it again later:
cd Silvero
npm install
npm run dev
# → http://localhost:3000
```

**Local Postgres** (installed natively — `C:\Program Files\PostgreSQL\17`):
- DB: `silvero_dev`, role: `silvero` / `silvero_dev_pw`
- `DATABASE_URL` is already set in both `.env` (Prisma CLI) and `.env.local` (Next.js runtime) — two files because they're two different tools' conventions
- Reseed anytime: `npx prisma db seed` (10 categories, 40 placeholder products)
- Re-migrate after a schema change: `npx prisma migrate dev`
- Browse the DB visually: `npx prisma studio`
- Make yourself an admin: register normally at `/account/register`, then `npx tsx prisma/promote-admin.ts you@example.com` (add `--demote` to reverse it). Takes effect on the next request — no sign-out needed.

**Payments/shipping are unconfigured on purpose** — `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_WEBHOOK_SECRET`, `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD` are blank in `.env.local`. Every route that calls them fails gracefully (clear error, no crash) rather than hanging — that's expected until real sandbox keys are added. Add them to `.env.local` and restart the dev server to go live.

**Try it yourself:** register at `/account/register`, browse `/shop`, add to cart, walk through `/checkout` (it'll stop at the Cashfree redirect step without real keys), check out `/circle` and `/gifting`.
