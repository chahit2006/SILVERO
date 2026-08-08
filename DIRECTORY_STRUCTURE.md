# SILVERO.925 — Directory Structure (v2, matches full IA sitemap)

```
silvero-925/
├── app/
│   ├── page.tsx                          # Homepage
│   │
│   ├── (shop)/
│   │   ├── shop/page.tsx                 # Shop All
│   │   ├── shop/new/page.tsx
│   │   ├── shop/bestsellers/page.tsx
│   │   ├── shop/occasion/page.tsx
│   │   ├── shop/price/page.tsx
│   │   ├── shop/nar/page.tsx             # Nar hub
│   │   ├── shop/nar/zanjeer/page.tsx
│   │   ├── shop/nar/nishaan/page.tsx
│   │   ├── shop/nar/sitara/page.tsx
│   │   ├── shop/nar/sankalp/page.tsx
│   │   ├── shop/nari/page.tsx            # Nari hub
│   │   ├── shop/nari/resham/page.tsx
│   │   ├── shop/nari/vaada/page.tsx
│   │   ├── shop/nari/noor/page.tsx
│   │   ├── shop/nari/jhalak/page.tsx
│   │   ├── shop/nari/kalai/page.tsx
│   │   └── shop/nari/valaya/page.tsx
│   │   # All 10 category pages share one <CategoryPLP> component (see components/shop/)
│   │   # — don't build 10 separate page implementations, one template + data.
│   │
│   ├── (gifting)/
│   │   ├── gifting/page.tsx              # Gifting Hub
│   │   ├── gifting/gift-cards/page.tsx
│   │   ├── gifting/wrapping/page.tsx
│   │   ├── gifting/guides/page.tsx
│   │   ├── gifting/guides/for-her/page.tsx
│   │   ├── gifting/guides/for-him/page.tsx
│   │   ├── gifting/guides/occasions/page.tsx
│   │   ├── gifting/guides/budget/page.tsx
│   │   ├── gifting/build-your-gift/page.tsx
│   │   └── gifting/registry/page.tsx
│   │
│   ├── (cart-checkout)/
│   │   ├── checkout/page.tsx
│   │   └── order/[id]/confirmation/page.tsx
│   │   # Cart itself is a drawer component (components/shop/CartDrawer.tsx), not a route
│   │
│   ├── account/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── page.tsx                      # Dashboard
│   │   ├── orders/page.tsx
│   │   ├── orders/[id]/page.tsx
│   │   ├── orders/[id]/tracking/page.tsx
│   │   ├── invoices/page.tsx
│   │   ├── returns/page.tsx
│   │   ├── returns/new/page.tsx
│   │   ├── wishlist/page.tsx
│   │   ├── recently-viewed/page.tsx
│   │   ├── addresses/page.tsx
│   │   ├── payments/page.tsx
│   │   ├── circle/page.tsx               # Circle dashboard (logged-in)
│   │   ├── circle/custom-order/page.tsx  # Gated form — server-side membership check
│   │   ├── referrals/page.tsx
│   │   ├── loyalty/page.tsx
│   │   └── preferences/page.tsx
│   │
│   ├── (guides)/
│   │   └── guides/
│   │       ├── ring-size/page.tsx
│   │       ├── bracelet-size/page.tsx
│   │       ├── necklace-length/page.tsx
│   │       ├── care/page.tsx
│   │       ├── silver/page.tsx
│   │       ├── hallmark/page.tsx
│   │       ├── materials/page.tsx
│   │       ├── styling/page.tsx
│   │       └── occasions/page.tsx
│   │       # All 9 share one <GuidePage> template component with per-page content/MDX
│   │
│   ├── (services)/
│   │   ├── appointment/page.tsx
│   │   └── services/engraving/page.tsx
│   │
│   ├── (corporate)/
│   │   ├── corporate/page.tsx
│   │   └── corporate/bulk/page.tsx
│   │
│   ├── (premium)/
│   │   ├── build-your-stack/page.tsx
│   │   ├── compare/page.tsx
│   │   ├── circle/page.tsx               # Public membership landing (not logged-in dashboard)
│   │   └── circle/custom-order/page.tsx  # Public entry — redirects members to /account/circle/custom-order
│   │   # /quiz dropped — replaced by advanced PLP filters (see FEATURE_SPEC_BATCH2.md §1)
│   │   # /shop-the-look dropped as standalone — already covered by homepage section 7
│   │   # /unboxing confirmed cut — needs 3D animation, not building it
│   │
│   ├── (about)/
│   │   └── about/
│   │       ├── page.tsx
│   │       ├── story/page.tsx
│   │       ├── craft/page.tsx
│   │       └── sustainability/page.tsx
│   │
│   ├── (static)/
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── shipping/page.tsx
│   │   ├── returns/page.tsx
│   │   ├── cookies/page.tsx
│   │   ├── accessibility/page.tsx
│   │   ├── contact/page.tsx
│   │   └── faq/page.tsx
│   │
│   ├── search/page.tsx
│   ├── not-found.tsx                     # 404
│   │
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── categories/route.ts
│       ├── products/route.ts
│       ├── products/[id]/route.ts
│       ├── search/route.ts
│       ├── cart/route.ts
│       ├── cart/[itemId]/route.ts
│       ├── checkout/route.ts
│       ├── cashfree/create-order/route.ts
│       ├── cashfree/webhook/route.ts
│       ├── shiprocket/rates/route.ts
│       ├── shiprocket/create-shipment/route.ts
│       ├── account/orders/route.ts
│       ├── account/orders/[id]/route.ts
│       ├── account/addresses/route.ts
│       ├── account/wishlist/route.ts
│       ├── account/returns/route.ts
│       ├── circle/join/route.ts
│       ├── circle/status/route.ts
│       ├── circle/custom-order/route.ts
│       ├── circle/custom-order/[id]/route.ts
│       ├── gift-cards/route.ts
│       ├── gift-cards/[code]/route.ts
│       ├── registry/route.ts
│       ├── registry/[shareSlug]/route.ts
│       ├── registry/[shareSlug]/purchase/route.ts
│       ├── appointments/route.ts
│       └── corporate-leads/route.ts
│
├── components/
│   ├── ui/                               # Buttons, inputs, cards — shared primitives
│   ├── layout/                           # Header, Footer, AnnouncementBar, SearchOverlay
│   ├── shop/                             # CategoryPLP, ProductCard, ProductDetailDrawer, CartDrawer
│   ├── checkout/                         # CheckoutSteps, AddressForm, PaymentStep
│   ├── account/                          # AccountSidebar, OrderCard, ReturnFlow
│   ├── circle/                           # CircleGate, CustomOrderForm
│   ├── gifting/                          # GiftCardForm, RegistryBuilder
│   └── premium/                          # QuizFlow, CompareTable, StackBuilder, ShopTheLook
│
├── lib/
│   ├── db.ts                             # Prisma client
│   ├── auth.ts                           # NextAuth config + membership-check helper
│   ├── cashfree.ts
│   ├── shiprocket.ts
│   ├── stock.ts                          # Stock-lock transaction — the ONLY place this logic lives
│   ├── image-upload.ts                   # Handles HEIC→JPG conversion for custom-order photos
│   └── validation/                       # Server-side input validation per form
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
│   └── uploads/
│       ├── products/
│       └── custom-orders/                # Circle member photo uploads
│
├── .env.example
├── .env.local
├── next.config.js
├── package.json
└── README.md
```

## Notes for the team

- **10 category pages, 1 component.** `CategoryPLP` takes a category slug as a prop/param — don't hand-build 10 near-identical pages.
- **9 guide pages, 1 template.** Content can live as MDX or a CMS-lite JSON file per guide — don't duplicate layout code 9 times.
- **`/circle` vs `/account/circle`.** `/circle` and `/circle/custom-order` are public marketing/entry pages; `/account/circle` and `/account/circle/custom-order` are the logged-in, gated versions. Confirm this distinction with the client before building — the IA doc lists both, worth a quick sanity check in the Phase 1 review.
- **Route groups** (folders in parentheses) organize files without adding a URL segment — `(shop)/shop/nar/page.tsx` still resolves to `/shop/nar`.
