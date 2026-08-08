# SILVERO.925 — Project Context

**Read this file first — whether you're a developer or an AI coding assistant.** This is the map; the other files are the territory.

## What this project is
A custom-built e-commerce site for SILVERO.925, a 925 sterling silver jewellery D2C brand (India), with Cashfree payments and Shiprocket shipping, hosted on Hostinger.

## ⚠️ Read the scope flag first
`PRD.md` opens with a scope flag — the real feature set (from the client's Information Architecture doc) is larger than a typical launch storefront. Confirm the Phase 1/2/3 split with the client before assuming everything below ships at once.

## Docs in this package, in reading order
1. `PRD.md` — what to build, full sitemap, scope flag, non-functional requirements, phase mapping
2. `DESIGN_SYSTEM.md` — colors, type, every component's spec, motion/animation rules — the frontend dev's primary reference
3. `DATA_MODEL.md` — the Prisma schema (every entity: products, orders, Circle, custom orders, gift cards, registry, etc.)
4. `API_SPEC.md` — every API route, method, and what it's responsible for
5. `DIRECTORY_STRUCTURE.md` — where every page and file goes, matching the real sitemap
6. `SECURITY_CHECKLIST.md` — build against this from day one, not just before Phase 3 testing
7. `TECH_STACK.md` — technology choices and why
8. `ARCHITECTURE.md` — system diagram, checkout flow, membership-gating flow, incident response
9. `HOSTING_HOSTINGER.md` — step-by-step Hostinger VPS deployment

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
