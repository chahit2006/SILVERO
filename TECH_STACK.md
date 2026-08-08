# SILVERO.925 — Tech Stack

Finalized stack for the custom-built e-commerce site. One repo, one deployable app — kept deliberately simple for a small dev team and a free-tools-only budget.

## Frontend
- **Next.js 14 (App Router)** + **TypeScript** + **Tailwind CSS**
- Server-rendered pages for SEO (product pages, category pages need to be crawlable/indexable)
- `next/image` for automatic responsive image resizing — serves a phone-appropriate file size instead of the raw upload (see Q2 in client meeting notes)

## Backend
- **Next.js API Routes** (same app, Node.js runtime) — no separate backend service to deploy or keep in sync
- Keeps the whole team working in one codebase instead of coordinating two repos

## Database
- **PostgreSQL** + **Prisma ORM**
- Cart, address, and checkout progress are written to the DB as the customer moves through each step — not held only in the browser, so a dropped connection doesn't lose anything (see Q1)
- Stock decrement at checkout uses a DB transaction with row-level locking (`SELECT ... FOR UPDATE`) — this is what prevents two customers both buying the last item (see Q4)

## Auth
- **NextAuth.js**, credentials-based
- Two roles at launch: **Circle member** (gates the custom order form) and **Admin** (order/product management)
- Membership check happens server-side on every request to a gated route/API — not just hidden in the UI (see Q3)

## Payments
- **Cashfree** — Node SDK + REST API, called from an API route
- Webhook endpoint (`/api/cashfree/webhook`) is the source of truth for "payment confirmed" — never trust the frontend alone to mark an order paid

## Shipping
- **Shiprocket API** — order handoff after payment confirmation (rate calculation + shipment creation)

## Image & File Storage
- Stored on the VPS disk (`/public/uploads`), served through Nginx, cached at Cloudflare's edge
- No third-party storage service needed at this scale — avoids an extra paid dependency

## Hosting & Infrastructure
- **Single VPS** (Ubuntu, DigitalOcean/Hetzner) running:
  - **PM2** — keeps the Node app alive, auto-restarts on crash
  - **Nginx** — reverse proxy + static file serving
  - **PostgreSQL** — same server
- **Cloudflare** in front — DNS, CDN, WAF, free SSL, DDoS protection
- **UptimeRobot** (free tier) — pings the site every few minutes, alerts before the client has to call at 11 PM (see Q5)

## Version Control & Environments
- Git + private GitHub repo
- `.env` for secrets (Cashfree keys, DB credentials, Shiprocket keys) — never committed
- Separate `.env` values for staging vs. production if the team sets up a staging VPS; otherwise a local dev `.env.local`

## Why this stack (not the earlier 3-option comparison)
This is Option B (Custom Stack) from the architecture comparison, simplified from "separate frontend + backend" down to **one Next.js app doing both** — same control and no Shopify/WooCommerce dependency, less deployment complexity for the team to manage long-term, and no extra service costs beyond the VPS.
