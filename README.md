# SILVERO.925

A custom-built e-commerce site for SILVERO.925, a 925 sterling silver jewellery D2C brand (India). One Next.js app for both frontend and API, Postgres via Prisma, Cashfree for payments, Shiprocket for shipping, deployed to a Hostinger VPS.

**Start with [`CLAUDE.md`](./CLAUDE.md)** for project orientation, then [`BUILD_STATUS.md`](./BUILD_STATUS.md) for exactly what's built right now and what isn't. This README only covers getting the app running.

## Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · PostgreSQL + Prisma · NextAuth (credentials) · Cashfree (payments, REST API) · Shiprocket (shipping) · `sharp` / `heic-convert` (Custom Order photo processing)

See [`TECH_STACK.md`](./TECH_STACK.md) for the reasoning behind each choice.

## Prerequisites

- **Node.js 20+**
- **PostgreSQL** (local install or a reachable instance — no Docker config is checked in)

## Setup

```bash
git clone <repo-url> silvero-925
cd silvero-925
npm install
```

### 1. Database

Create a database and a dedicated app role (not the `postgres` superuser — see `HOSTING_HOSTINGER.md`):

```sql
CREATE ROLE silvero WITH LOGIN PASSWORD 'your-local-password' CREATEDB;
CREATE DATABASE silvero_dev OWNER silvero;
```

### 2. Environment variables

Two files are needed, because Next.js and the Prisma CLI read different ones:

- **`.env.local`** — used by the Next.js dev/prod server
- **`.env`** — used by the Prisma CLI (`migrate`, `db seed`, `studio`)

Copy `.env.example` to both and fill in at least `DATABASE_URL`:

```bash
cp .env.example .env.local
cp .env.example .env
```

```ini
# .env.local and .env — DATABASE_URL must match in both
DATABASE_URL=postgresql://silvero:your-local-password@localhost:5432/silvero_dev

# .env.local only — Next.js doesn't need these, Prisma CLI doesn't read them
NEXTAUTH_SECRET=   # generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NEXTAUTH_URL=http://localhost:3000

# Leave blank for local dev — every route that calls these fails gracefully
# (clear error, no crash/hang) when unset. Fill in real sandbox keys to test
# payments/shipping for real; see BUILD_STATUS.md's "not done" table for what
# that would unblock.
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=
CASHFREE_WEBHOOK_SECRET=
SHIPROCKET_EMAIL=
SHIPROCKET_PASSWORD=
```

Neither `.env` nor `.env.local` is committed (`.gitignore`) — this step is required on every fresh checkout.

### 3. Migrate + seed

```bash
npx prisma migrate dev   # creates the schema
npx prisma db seed       # 10 categories, 40 placeholder products (no real photography yet)
```

### 4. Run

```bash
npm run dev
```

→ **http://localhost:3000**

## Everyday scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build / run it |
| `npm run lint` | Next.js lint |
| `npx prisma studio` | Browse the DB in a GUI |
| `npx prisma migrate dev --name <desc>` | Create + apply a migration after a schema change |
| `npx prisma db seed` | Re-run the seed (safe to re-run, upserts) |
| `npx tsx prisma/promote-admin.ts <email>` | Promote an existing account to admin (register normally first). Add `--demote` to reverse it. Takes effect immediately — no re-login needed. |

## Trying it out

1. Register an account at `/account/register`
2. Browse `/shop`, add something to your bag, walk through `/checkout` — it'll stop right before the Cashfree redirect since no payment keys are configured locally, which is expected
3. `/circle` (membership), `/gifting` (gift cards, registry, guides)
4. Promote yourself to admin (see above), then visit `/admin/orders`

## Project docs

Everything else — data model, API routes, directory layout, security checklist, architecture, hosting steps — lives in the root-level `*.md` files. `CLAUDE.md` is the index; read it first.
