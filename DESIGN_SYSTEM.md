# SILVERO.925 — Design System

Sourced from two places: exact values from `SILVERO_Information_Architecture_v1_2.docx` (IA v2.0) where it specifies them, and colors **sampled directly from the client's mockup screenshots** where the IA doc only names a color without a hex value. Sampled values are marked — confirm them against final Figma files/brand guidelines before locking them in, since sampling from a JPEG isn't pixel-perfect.

## 1. Color Palette

| Token | Value | Source | Used for |
|---|---|---|---|
| `--color-olive-dark` | `#3A3820` *(sampled)* | Mockup | Primary CTA buttons ("Add to Bag"), nav drawer background, checkout confirmation background |
| `--color-charcoal` | `#1A1A1A` | IA doc (exact) | Footer background |
| `--color-ivory` | `#F0EAE3` *(sampled)* | Mockup | Page/section backgrounds |
| `--color-text-dark` | `#3F2C1B` *(sampled)* | Mockup | Headings, body copy on light backgrounds |
| `--color-white` | `#FFFFFF` | Standard | Cards, wishlist icon backgrounds, outlined buttons |

**⚠️ Confirm with the client/designer:** the IA doc calls the accent color "olive" throughout but never gives a hex. The sampled value above (`#3A3820`) is a very dark olive/near-black-green, not a bright olive — get the real brand hex from Figma/brand guidelines before building, don't ship the sampled approximation as final.

**⚠️ Also confirm:** the homepage hero CTA ("EXPLORE COLLECTIONS") renders as a **cream/outlined** button in the mockup, but the IA doc text describes it as a "rounded olive button." Check which is correct — they conflict.

## 2. Typography

- **Display/headings:** Playfair Display (serif) — used for the logo, hero headline, section headings, category names
- **Body/UI:** a clean sans-serif (not specified by name in the IA doc — pick one, e.g. Inter or similar, and confirm with the client)
- **Product name (card):** uppercase, 11–12px, 600 weight
- **Price (card):** 13px, 500 weight
- **Category header (PLP):** h1, uppercase

## 3. Spacing & Shape

- Product card image corner radius: **10px**
- Product grid card gap: **16–20px**
- Header height: **64px desktop / 56px mobile**
- Cart drawer width: **400px**

## 4. Global Components

### Header / Navigation
- Logo "SILVERO.925" left-aligned, Playfair Display, olive accent on ".925"
- Desktop primary nav: 7 items — Nar, Nari, Gifting, Silver Guide, About Us + JEWELLERY mega-menu dropdown (hover-triggered, shows Nar + Nari sub-categories)
- Right cluster: Search icon | Account icon | Wishlist heart (with count) | Bag icon (with count)
- Announcement bar above nav: olive background, "COMPLIMENTARY SHIPPING ACROSS INDIA | 925 STERLING SILVER | LIFETIME PLATING | EASY RETURNS"
- Sticky behavior: hides on scroll-down, reappears on scroll-up, **300ms** transition
- Mobile: hamburger left, logo centered, search + bag right; tapping hamburger opens a full-screen slide panel from the left (sampled: dark olive background, see color table)

### Search Overlay
- Full-screen, dark backdrop blur, centered input in a rounded card
- Placeholder: "What are you looking for?"
- Predictive results: product suggestions with image + price, plus category suggestions
- Popular search pills: "Vaada", "Zanjeer", "Stacking", "Noor", "Gift cards"
- Closes via X icon, Escape key, or click outside
- Fade in: **300ms**

### Footer
- Background: charcoal `#1A1A1A`
- 4 columns: Brand (logo + tagline) · Shop (Nar, Nari, New Arrivals, Bestsellers, Gift Cards) · Help (FAQs, Order Tracking, Shipping, Returns, Size Guides, Contact) · About (Our Story, Silver Guide, Hallmark Guide, Jewellery Care, Sustainability)
- Bottom bar: payment badges, copyright, Privacy, Terms
- **⚠️ Payment badges currently say "Razorpay, UPI, Visa, Mastercard" in the IA doc — update to Cashfree branding, since the project uses Cashfree, not Razorpay.**
- Newsletter: "Stay in the know" — email input + submit, no discount incentive

### Persistent Elements
- WhatsApp CTA: floating bottom-right, green icon, opens WhatsApp chat
- Cookie consent: bottom banner, "Accept" + "Manage preferences"
- Back to top: appears after 2 viewport scrolls, arrow icon bottom-right

## 5. Homepage (12 sections)

| # | Section | Spec |
|---|---|---|
| 1 | Hero | Split layout, text left (50%) / photography right (50%), min 75vh. Headline in Playfair Display. Carousel of 2–3 heroes, crossfade, 6s auto-advance, dot navigation. This is the **only** auto-play carousel allowed on the site. |
| 2 | Trust Bar | 4-icon horizontal row, white background |
| 3 | Gender Category Cards | 2 large cards (Nar / Nari), aspect 3:4 or 4:5, hover scale 1.03 over 0.4s |
| 4 | New Arrivals Grid | 4-product grid + "View all" link |
| 5 | Storytelling Cards | 3 editorial cards, 3:4 aspect, gradient/photo overlay with dark scrim, white text, hover lift |
| 6 | Bestsellers | 4-product grid or horizontal carousel |
| 7 | Shop The Look | Full-bleed lifestyle image with clickable product hotspots → popover card |
| 8 | Brand Story Block | Centered text, ivory background, max 640px width, Playfair italic |
| 9 | As Seen In | Press logo strip (Vogue, Elle, Grazia, Bazaar, Femina), low opacity |
| 10 | Trust Bar (detailed) | 4 items in rounded icon containers |
| 11 | Circle CTA | Split section — decorative left, olive CTA right, email capture |
| 12 | Instagram/UGC | 4–6 square image grid, "#SILVERO925" |

Estimated total scroll: 6–8 viewport heights on desktop.

## 6. Product Listing Page (PLP)

- **Desktop:** sidebar filters left (200px) + 4-column product grid
- **Mobile:** full-width grid, filters in a bottom-sheet modal
- **Filters:** Category (checkboxes), Price Range (**dual-thumb range slider** — updated 2026-08-08, `FEATURE_SPEC_BATCH2.md` §1 replaced the original ₹0–2K/2K–5K/5K–10K/10K–15K/15K+ preset bands; the slider's ends come from the live catalogue via `getPriceBounds()`), Material, Stone, Occasion — each with chevron expand/collapse
- **Active filters:** dismissible tags + "Clear all"
- **Mobile filter sheet:** edits a draft and commits on an explicit "Apply filters" button (`FEATURE_SPEC_BATCH2.md` §1), rather than applying live behind the sheet. Desktop sidebar still applies on change.
- **Sort:** top-right dropdown — Featured, Price Low–High, Price High–Low, Newest
- **Pagination:** "Load more" button, 24 products per load, "Showing X of Y products" + "View all" link

### Product Card
- Image: 1:1 square, 10px corner radius, hover scale 1.02, optional quick-add overlay
- Badge: "BESTSELLER" or "NEW" — olive background, white text, top-left
- Wishlist heart: top-right, circular white background, fills olive on click (200ms)
- Info below: product name (uppercase, 11–12px, 600 weight) + price (13px, 500 weight)

## 7. Product Detail (opens inline/drawer/modal within the PLP — no standalone page)

- **Gallery** (left): main image with prev/next arrows + zoom icon, 4-thumbnail strip below
- **Info** (right): name (uppercase), price, description, trust badges, size selector, "ADD TO BAG" (rounded, filled olive), "BUY NOW" (outlined), delivery info, accordions (Details / Care / Shipping / Returns — slide down 300ms, chevron rotates 180°)
- **Cross-sell:** "You may also like" product row below

## 8. Cart & Checkout

### Cart Drawer
- Slides from right, 400ms cubic-bezier, 400px width
- Per item: rounded thumbnail, name, material, size, price, quantity stepper, remove (X)
- Gift toggle → gift wrapping + gift note fields
- Subtotal above CTA with shipping status message
- "Have a code?" collapsible promo field
- CTA: "CHECKOUT" — rounded, filled olive
- Empty state: "Your bag is empty. Explore our collections." + button

### Checkout Page
- Layout: form left (60%) / order summary right (40%)
- Guest checkout always available
- Steps: Contact → Shipping → Payment, with a progress indicator
- Contact: email, phone (+91), first/last name
- Shipping: address, city, state, PIN (auto-fills city), country (India default); "Ship to different address" option for gifting
- Delivery options: Standard (free, 5–7 days) | Express (paid, 2–3 days)
- Payment: Cashfree (UPI, cards, net banking, wallets, EMI) — **the IA doc text says "Razorpay" here; this is outdated, the project uses Cashfree per the signed proposal**
- "Place order" — rounded, filled olive button

## 9. Motion & Animation Spec

| Interaction | Spec |
|---|---|
| Route change | Fade out 200ms, fade in 300ms with 30px translateY |
| Loading state | Skeleton screens, pulse 2s loop |
| Section scroll-in | Fade + translateY(30px), triggers at 10% viewport entry, 800ms cubic-bezier |
| Grid stagger | 50–80ms per item, max 5 items staggered |
| Button hover | Background darken, 150ms |
| Link hover | Underline slides from left, 200ms |
| Product card hover | Scale 1.02, 300ms |
| Cart drawer | Slide from right, 400ms cubic-bezier |
| Search overlay | Fade in, 300ms |
| Accordion | Slide down 300ms, chevron rotates 180° |
| Toast | Slide in from right 300ms, auto-dismiss after 3s |
| Add to bag | Button shows a checkmark for 1.5s, bag count bounces |
| Wishlist | Heart fills olive, 200ms |

**Rules:** no parallax, no scroll-jacking, no horizontal scroll, no auto-play carousels anywhere except the homepage hero. Respect `prefers-reduced-motion` — disable all animation, use instant state changes instead.

## 10. Open Items to Confirm Before Build

1. Exact brand hex for "olive" (sampled value is an approximation)
2. Hero CTA button style — cream/outlined (per mockup) vs. filled olive (per doc text)
3. Footer payment badges — update copy/assets from Razorpay to Cashfree
4. Checkout payment section copy — same Razorpay → Cashfree correction
5. Body/UI sans-serif typeface name (not specified in the IA doc)
