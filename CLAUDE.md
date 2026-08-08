# SILVERO.925 — Project Context

**Read this file first — whether you're a developer or an AI coding assistant.** This is the map; the other files are the territory.

## What this project is
A custom-built e-commerce site for SILVERO.925, a 925 sterling silver jewellery D2C brand (India), with Cashfree payments and Shiprocket shipping, hosted on Hostinger.

## ⚠️ Read the scope flag first
`PRD.md` opens with a scope flag — the real feature set (from the client's Information Architecture doc) is larger than a typical launch storefront. Confirm the Phase 1/2/3 split with the client before assuming everything below ships at once.

## Where things actually stand
**Read `BUILD_STATUS.md` before writing any code.** It's the current source of truth for what's built, what's not, and every flagged gap along the way — this file should be more current than this section of `CLAUDE.md` will ever be. Right now: Phase 1 and most of Phase 2 are done; 5 features are actively being built per `FEATURE_SPEC_BATCH2.md`; Phase 3 hasn't started.

## Docs in this package, in reading order
1. `BUILD_STATUS.md` — what's actually built right now, what's not, flagged gaps
2. `PRD.md` — what to build, full sitemap, scope flag, non-functional requirements, phase mapping
3. `FEATURE_SPEC_BATCH2.md` — the 5 customer-facing features currently in active development
4. `ADMIN_PANEL_SPEC.md` — the admin dashboard/inventory/orders panel (not yet started)
5. `DESIGN_SYSTEM.md` — colors, type, every component's spec, motion/animation rules — the frontend dev's primary reference
6. `DATA_MODEL.md` — the Prisma schema (every entity: products, orders, Circle, custom orders, gift cards, registry, etc.)
7. `API_SPEC.md` — every API route, method, and what it's responsible for
8. `DIRECTORY_STRUCTURE.md` — where every page and file goes, matching the real sitemap
9. `SECURITY_CHECKLIST.md` — build against this from day one, not just before Phase 3 testing
10. `TECH_STACK.md` — technology choices and why
11. `ARCHITECTURE.md` — system diagram, checkout flow, membership-gating flow, incident response
12. `HOSTING_HOSTINGER.md` — step-by-step Hostinger VPS deployment

## Non-negotiable constraints
1. **Free tools/plugins only.** No paid packages, no paid API tiers beyond the Hostinger VPS itself.
2. **One repo, one app.** Next.js App Router serves both frontend and API routes.
3. **10 category pages share one component; 9 guide pages share one template.** Don't hand-build near-duplicates — see `DIRECTORY_STRUCTURE.md` notes.
4. **Stock-lock logic lives in exactly one place** (`lib/stock.ts`).
5. **Membership checks are server-side, always** — for Circle-gated routes and the `/api/circle/custom-order` endpoint specifically. Hiding a button in the UI is never sufficient by itself.
6. **Cashfree webhook is the only source of truth for "paid."** Never mark an order paid from a frontend redirect alone.
7. **Cart/checkout state is persisted server-side at each step**, not held only in browser state.
8. **HEIC photo uploads** (Custom Order form) must be converted server-side before storage/display.

## Phase discipline
This project is delivered in 3 client-approved phases (`PRD.md` §7). Don't build a later phase's features early, and don't silently add anything outside the approved phase scope — flag it to the team lead instead.

## When in doubt
Check `PRD.md` for scope, `API_SPEC.md`/`DATA_MODEL.md` for how data should flow, `ARCHITECTURE.md` for how a cross-cutting flow (checkout, gating, incidents) is supposed to work, and `DIRECTORY_STRUCTURE.md` for where new code belongs. If something genuinely isn't covered, raise it — don't assume.
