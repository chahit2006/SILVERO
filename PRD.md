# SILVERO.925 — Product Requirements Document (v2, from IA v2.0)

> This PRD replaces the earlier draft. It is built directly from `SILVERO_Information_Architecture_v1_2.docx` (IA v2.0, July 2026) — treat that document as the source of truth for anything not captured here.

## ⚠️ Scope Flag — Read First

The IA v2.0 document describes a **large** site: 2 gender hubs × 10 sub-categories, a full gifting ecosystem (gift cards, registry, build-your-gift), 9 education/guide pages, 4 "premium" discovery features (quiz, compare, build-your-stack, shop-the-look), a photo-upload custom order system, appointments, and corporate/bulk lead forms — on top of standard cart/checkout/account.

This is **significantly larger** than a simple storefront. The earlier 40-day timeline and single-VPS costing were sized for a simpler build. Before development starts, re-confirm with the client:
1. Whether **all** of this ships at launch, or a reduced set (the doc itself already marks some things FUTURE — see below)
2. Whether the 40-day / ₹70,000 scope needs revisiting given the real feature count

Everything below is organized so you can build the "must-have" core first and layer the rest in — see §7 Phase Mapping.

## 1. Confirmed Out of Scope (per IA v2.0 changelog)

- Collections Hub and collection sub-pages
- Standalone Product Detail Page — products open inline within their category page (drawer/modal/inline expansion — team to pick one pattern, see §4)
- "Saved For Later" in Account — Wishlist covers it
- Entire Journal section
- AI Jewellery Concierge — replaced by the Jewellery Finder Quiz
- Store Locator / Store Detail pages
- **Phase 2 (post-launch) roadmap, not built now:** Silver Care Tracker, Collection Builder

## 2. Full Sitemap

### Shop
| Route | Notes |
|---|---|
| `/shop` | Shop All |
| `/shop/new` | New Arrivals |
| `/shop/bestsellers` | Bestsellers |
| `/shop/occasion` | Shop by Occasion |
| `/shop/price` | Shop by Price |
| `/shop/nar` | Nar (Men) hub |
| `/shop/nar/zanjeer` | Chains |
| `/shop/nar/nishaan` | Rings |
| `/shop/nar/sitara` | Tennis Bracelets |
| `/shop/nar/sankalp` | Kada |
| `/shop/nari` | Nari (Women) hub |
| `/shop/nari/resham` | Chains |
| `/shop/nari/vaada` | Rings |
| `/shop/nari/noor` | Pendant Sets |
| `/shop/nari/jhalak` | Pendant Chains |
| `/shop/nari/kalai` | Bracelets |
| `/shop/nari/valaya` | Kada |

### Gifting
`/gifting` · `/gifting/gift-cards` · `/gifting/wrapping` · `/gifting/guides` (+ `for-her`, `for-him`, `occasions`, `budget`) · `/gifting/build-your-gift` · `/gifting/registry`

### Cart & Checkout
`/cart` (drawer, not a page) · `/checkout` · `/order/[id]/confirmation`

### Account
`/account/login` · `/register` · `/forgot-password` · `/account` (dashboard) · `/account/orders` (+ `[id]`, `[id]/tracking`) · `/account/invoices` · `/account/wishlist` · `/account/recently-viewed` · `/account/addresses` · `/account/payments` · `/account/circle` · `/account/circle/custom-order` · `/account/referrals` · `/account/loyalty` · `/account/preferences`

### Guides (SEO/education, all same template)
`/guides/ring-size` · `/bracelet-size` · `/necklace-length` · `/care` · `/silver` · `/hallmark` · `/materials` · `/styling` · `/occasions`

### Services
`/appointment` · `/services/engraving`

### Corporate
`/corporate` · `/corporate/bulk`

### Premium / Discovery
`/shop-the-look` · `/build-your-stack` · `/quiz` · `/compare` · `/unboxing` · `/circle` (public membership landing) · `/circle/custom-order` (public — redirects logged-in Circle members to `/account/circle/custom-order`, prompts non-members/guests to join)

### About & Static
`/about` (+ `/story`, `/craft`, `/sustainability`) · `/privacy` · `/terms` · `/shipping` · `/cookies` · `/accessibility` · `/contact` · `/faq` · `/search` · `/404`

## 3. Brand & Design Tokens (from IA §2, §15)

- **Typeface:** Playfair Display (serif, headings/logo) + a clean sans body face
- **Accent color:** Olive (used for CTAs, badges, announcement bar)
- **Footer background:** Charcoal `#1A1A1A`
- **Logo:** "SILVERO.925" — olive accent on ".925"
- **Motion:** 200–400ms fades/slides throughout, no parallax, no scroll-jacking, no auto-play carousels except the homepage hero (6s crossfade). Full spec in IA §15 — respect `prefers-reduced-motion`.
- Full component-level detail (header height, card corner radius, hover states, etc.) is in IA §2–§4 — don't re-derive it, copy it directly from the source doc into Figma/CSS.

## 4. Key Feature Notes for Devs

**No standalone Product Detail Page.** Product detail opens *within* the category page — pick one pattern (side drawer / modal / inline expansion) and use it consistently everywhere. Drawer is the least layout-disruptive option for a beginner team — recommended default unless the client prefers otherwise.

**Custom Order (One-of-One)** — the most complex single feature:
- Gated to SILVERO Circle members only (server-side check, not just UI)
- Form: up to 5 photo uploads (JPG/PNG/HEIC — HEIC needs server-side conversion to JPG for browser display, use `sharp` with HEIC support or `heic-convert`), jewellery type, free-text description, conditional sizing fields, weight, melting type, budget range, timeline, contact preference
- Status pipeline: `Submitted → Under Review → Quotation Sent → Approved → In Production → Quality Check → Ready → Shipped`
- Confirmation email with a reference number on submit

**SILVERO Circle membership** has two qualification paths: free via a past purchase, or paid for non-purchasers. Confirm the exact price/logic with the client before building the gate.

**Gift Cards** — both digital (email delivery) and physical (shipped) variants, preset + custom amounts, personalization fields, scheduled delivery date.

**Jewellery Registry** — guest checkout can fulfill items on someone else's registry; owner sees purchased status. This needs guest-accessible purchase flow tied to a non-authenticated registry share link.

**Quiz / Compare / Build-Your-Stack / Shop-the-Look** — all client-side-heavy interactive features; none strictly need new DB tables except Quiz results (optional, can be session-only for launch).

## 5. Data Entities

See `DATA_MODEL.md` for the full Prisma schema. Summary: User, Address, Category, Product, CartItem, Order/OrderItem, Wishlist, RecentlyViewed, CircleMembership, CustomOrder, Referral, LoyaltyTransaction, GiftCard, Registry/RegistryItem, Appointment, CorporateLead. (Returns & Exchanges — and its `Return`/`ReturnRequest` model — was built and then removed 2026-08-09; see `BUILD_STATUS.md`.)

## 6. Non-Functional Requirements (carried over, still apply)

- **NFR-1 Checkout resilience** — cart/address/checkout step persist server-side, survives a dropped connection
- **NFR-2 Image performance** — `next/image` auto-resizing for product photos; same principle applies to custom-order upload photos
- **NFR-3 Membership gating** — server-side check on every Circle-gated route/API, not UI-only
- **NFR-4 Stock integrity** — DB transaction + row locking at checkout, prevents overselling
- **NFR-5 Incident recoverability** — monitoring + rollback-first response
- **NFR-6 Budget** — free plugins/services only, beyond agreed Hostinger VPS cost

## 7. Phase Mapping

The client's proposal defines 3 **delivery** phases (review meeting at the end of each). Map the IA's feature set into them like this — confirm the exact split with the client before committing:

| Delivery Phase | Suggested Scope |
|---|---|
| **Phase 1** — UI, features, backend walkthrough | Global components, homepage, full Shop (Nar/Nari + all sub-categories), product browsing/detail pattern, cart, account shell, all static/guide pages |
| **Phase 2** — Payment gateway + shipping, full functionality | Checkout + Cashfree, Shiprocket, Circle membership + gating, Custom Order flow, Gifting ecosystem (gift cards, registry, wrapping), Quiz/Compare/Build-Your-Stack, Appointments, Corporate/Bulk forms |
| **Phase 3** — Security testing + hosting | Full QA pass, security review of all gated/payment flows, Hostinger deployment, monitoring setup, handover |

Changes requested outside the phase they belong to are new scope per the signed proposal terms.

## 8. Reference Documents
- `DATA_MODEL.md` — Prisma schema
- `API_SPEC.md` — API route list
- `DIRECTORY_STRUCTURE.md` — repo layout matching this sitemap
- `TECH_STACK.md` / `ARCHITECTURE.md` — infrastructure layer (still valid)
- `HOSTING_HOSTINGER.md` — Hostinger-specific deployment steps
- `CLAUDE.md` — start here; project orientation for the dev team and any AI assistant working in the repo
