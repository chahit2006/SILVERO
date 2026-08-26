# IMAGES.md — Photo import log (photos_Silvero → codebase)

Log of image-wiring passes done for design review, sourced from
`photos_Silvero/`. **All images placed via this log are TRIAL images for
visual review only** — real photos will be uploaded through the admin panel
straight into the DB once it exists. Nothing here touches
`prisma/schema.prisma`, `prisma/seed.ts`, or the database.

This is a running log, not an ongoing spec — see `DESIGN_SYSTEM.md` for the
actual section specs.

---

## Pass 1 (2026-08-27)

Existing image convention in this codebase (unchanged, just followed):
homepage/section components hold a small hardcoded `image` string pointing
at `public/placeholders/*`, rendered via `next/image` with `fill` +
`object-cover`. New photos were copied into `public/placeholders/` under
clean kebab-case names (matching the existing `lifestyle-a.svg` style) and
wired into the relevant `image` field — no new folder structure invented.

| Source file (`photos_Silvero/`) | Copied to | Wired into |
|---|---|---|
| `Nar-hero-main-website.png` | `public/placeholders/nar-hero.png` | `components/home/Hero.tsx` — "Nar — Men" carousel slide |
| `Nari-hero-main-website.png` | `public/placeholders/nari-hero.png` | `components/home/Hero.tsx` — "Nari — Women" carousel slide |
| `Nar-category-placeholder-(1).png` | `public/placeholders/nar-category.png` | `components/home/GenderCards.tsx` — "Nar" card |
| `Nari-(1)-category-placeholder.png` | `public/placeholders/nari-category.png` | `components/home/GenderCards.tsx` — "Nari" card |
| `SILVERO-cta.png` | `public/placeholders/silvero-cta.png` | `components/home/CircleCTA.tsx` — decorative left panel |
| `Brand-story-hero.png` | `public/placeholders/brand-story-hero.png` | `components/home/BrandStoryBlock.tsx` — full-bleed background behind the quote |
| `Craft-hero-(1).png` | `public/placeholders/craft-hero.png` | `app/(about)/about/craft/page.tsx` — full-width hero banner above the page content |
| `Craft-(2).png` | `public/placeholders/craft-supporting.png` | `app/(about)/about/craft/page.tsx` — inline supporting image in the copy |

**Files changed:** `Hero.tsx`, `GenderCards.tsx`, `CircleCTA.tsx` (source-string swaps).
**Files added to:** `BrandStoryBlock.tsx`, `app/(about)/about/craft/page.tsx` (had no image slot before; `components/static/StaticPage.tsx` — shared by every other static page — was left untouched).
**Files added:** the 8 images above under `public/placeholders/`.

### Held back after Pass 1
`Nar-category-placeholder-(2).png`, `Festive-hero.png`, `Our-promise-(1–4).png`,
`Collection .png`, `Virasat-(1)/(2).png`, `Meera-(1)-collection.png`,
`Shaan-(1)-collection.png`, Zanjeer/Sankalp/Nishaan/Resham/Vaada product
images, `Rang-(1–4).png`, `Nazar-(1).png`, `Braclet-Nar-(1).png` — see Pass 2
below for what changed on these.

---

## Pass 2 (2026-08-27) — fixes + trial product images

### FIX 1 — Hero carousel lead slide
Client chose "reorder" over spending an unused photo on it. `components/home/Hero.tsx`'s
`SLIDES` array reordered: Nar (`nar-hero.png`) now leads, Nari (`nari-hero.png`)
second, and the placeholder "New Season / Silver, made for everyday wear"
slide (still `/placeholders/lifestyle-a.svg` — no real photo assigned) now
plays last instead of first. No new images copied; `priority` still applies
correctly since it's keyed to slide index 0, not a specific slide.

### FIX 2 — `components/home/BrandStoryBlock.tsx` visibility
The background photo was effectively invisible (15% opacity image under a
70%-opaque ivory overlay ≈ 4.5% visible). Changed to:
- Image opacity: `opacity-15` → `opacity-35`
- Overlay: `bg-ivory/70` → `bg-ivory/45` (≈19% photo visibility now)
- Added a local `bg-ivory/80` backdrop directly behind the quote text so
  text-dark/ivory contrast stays at its original AA-safe level regardless
  of what's in the photo.

No new images copied — reuses `brand-story-hero.png` from Pass 1.

### FIX 3 — Homepage "The Craft" card
`components/home/StorytellingCards.tsx`: the "The Craft" card's image
swapped from `/placeholders/lifestyle-a.svg` to `/placeholders/craft-hero.png`
(reusing the Pass 1 copy — no new file). "Our Story" and "Sustainability"
cards left untouched (still `lifestyle-b.svg` / `lifestyle-c.svg`) — no
photos exist for those yet.

### FIX 4 — Trial product images (frontend-only, temporary)
Added `lib/trialImages.ts` — a category-slug → image-array override map,
explicitly marked `TEMPORARY` with deletion instructions in its header
comment. It matches by **product slug prefix** (e.g. `zanjeer-…`) rather
than the category relation, because the list/grid product queries
(`lib/products.ts`) don't `include: { category: true }` — this keeps the
whole fix frontend-only with zero query-layer or DB changes.

Wired into:
- `components/shop/ProductCard.tsx` — grid tile now reads
  `getTrialImages(product) ?? product.images` instead of `product.images`
  directly.
- `components/shop/ProductDetailDrawer.tsx` — same override, applied once
  to a local `images` variable used everywhere the drawer previously read
  `product.images` (main image, zoom/lightbox, prev/next, thumbnail strip).
  **No new gallery component was built** — the drawer already supported
  multi-image galleries (prev/next, thumbnails, zoom) whenever a product
  has more than one image; this fix just feeds it more than one image for
  five categories.

Images copied into `public/placeholders/` (kebab-case):

| Source | Copied to | Category |
|---|---|---|
| `Zanjeer-(1).png` – `(4).png` | `zanjeer-1.png` – `zanjeer-4.png` | `zanjeer` |
| `Sankalp-(1).png`, `(2).png` | `sankalp-1.png`, `sankalp-2.png` | `sankalp` |
| `Nishaan-(1).png`, `(2).png` | `nishaan-1.png`, `nishaan-2.png` | `nishaan` |
| `Resham-(1).png` | `resham-1.png` | `resham` |
| `Vaada-(1).png` | `vaada-1.png` | `vaada` |

**To remove this trial layer later:** delete `lib/trialImages.ts` and its
import + one line in `ProductCard.tsx` and `ProductDetailDrawer.tsx` (each
marked `// TEMPORARY`).

**Files changed:** `BrandStoryBlock.tsx`, `StorytellingCards.tsx`,
`ProductCard.tsx`, `ProductDetailDrawer.tsx`.
**Files added:** `lib/trialImages.ts`, plus the 10 images above under
`public/placeholders/`.
**Not touched:** `prisma/schema.prisma`, `prisma/seed.ts`, migrations, the
database, checkout/payment/Shiprocket/API/auth/config code.

### Step 3 — remaining unplaced images (report only, nothing built)

| Source file(s) | What would need to exist first |
|---|---|
| `Rang-(1).png` – `(4).png` | No "Rang" category slug anywhere (`lib/nav-data.ts` / `prisma/seed.ts`). Needs a new category created — a schema/seed change, out of scope for a trial-only pass. |
| `Nazar-(1).png` | Same as Rang — no category or product identity named "Nazar" exists anywhere. |
| `Braclet-Nar-(1).png` | The NAR bracelet category **does** exist (`sitara`, "Tennis Bracelets") — this one *could* be added to `lib/trialImages.ts` the same way as Zanjeer/Sankalp/etc. with zero new infrastructure. Not added because it wasn't on the explicit FIX 4 list — say the word and it's a 2-line addition. |
| `Virasat-(1)-collection.png`, `Virasat-(2).png`, `Meera-(1)-collection.png`, `Shaan-(1)-collection.png` | "Virasat"/"Meera"/"Shaan" aren't categories, products, or any other entity in the code — there's no "collection" concept in the data model at all. Needs a real feature decision (new categories? a new Collection model? a static marketing page?) before anything can be placed. |
| `Festive-hero.png` | No "Festive" section exists. Held per client instruction (2026-08-27) — would be a new homepage section outside `DESIGN_SYSTEM.md`'s spec'd 12. |
| `Our-promise-(1).png` – `(4).png` | No "Our Promise" section exists. Client confirmed it should eventually be a 4-image carousel, but building it is a new section outside the spec'd 12 — held pending a spec update / team lead sign-off. |
| `Collection .png` (note: actual filename has a space before `.png`) | No general "Collections" page or banner exists anywhere in the code. |
| `Nar-category-placeholder-(2).png` | `GenderCards.tsx` has exactly one "Nar" image slot, already filled by `(1)` (client's choice). No second slot exists — would need a new UI element (second card, or a mini-carousel on the existing one) before this has anywhere to go. |

All of the above remain untouched in `photos_Silvero/` — nothing was copied
or wired in for them this pass either.
