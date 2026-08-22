# SILVERO.925 — Data Model

Prisma schema covering every entity implied by the IA. Beginner-friendly starting point — extend fields as features get built, don't feel obligated to build every relation on day one.

> **Sync note (2026-08-09):** this file had drifted from `prisma/schema.prisma` — several fields added during Phase 2 (Order's contact/shipping snapshot, GiftCard's payment fields, `registryItemId`, `Product.weightGrams`, `RecentlyViewed.id`) were missing here even though they were live in the database. `schema.prisma`'s own header says this file is the source of truth, but in practice the schema is what's deployed and tested — treat *it* as ground truth if the two ever disagree again, and fix this file to match, not the other way around.

```prisma
// schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Gender {
  NAR
  NARI
}

enum OrderStatus {
  PENDING
  PAID
  SHIPPED
  DELIVERED
  CANCELLED
}

enum CustomOrderStatus {
  SUBMITTED
  UNDER_REVIEW
  QUOTATION_SENT
  APPROVED
  IN_PRODUCTION
  QUALITY_CHECK
  READY
  SHIPPED
}

enum CircleQualification {
  PURCHASE
  PAID
}

// ADMIN_PANEL_SPEC.md §1. Three values, and the check is always `=== 'ADMIN'`
// exactly — never `!== 'CUSTOMER'`, which would let a CIRCLE member through.
// No self-serve path to ADMIN: /api/auth/register always writes the CUSTOMER
// default, and admins are promoted out-of-band via prisma/promote-admin.ts.
enum Role {
  CUSTOMER
  CIRCLE
  ADMIN
}

model User {
  id             String               @id @default(cuid())
  email          String               @unique
  phone          String?
  passwordHash   String
  firstName      String
  lastName       String
  role           Role                 @default(CUSTOMER)
  createdAt      DateTime             @default(now())

  // Added 2026-08-09 — email-OTP MFA, second factor after password for both
  // customer and admin logins (lib/auth.ts). otpHash is bcrypt, cleared on
  // successful verify, expiry, or hitting otpAttemptCount's 5-try limit.
  otpHash         String?
  otpExpiresAt    DateTime?
  otpAttemptCount Int      @default(0)

  addresses      Address[]
  orders         Order[]
  wishlist       WishlistItem[]
  recentlyViewed RecentlyViewed[]
  circle         CircleMembership?
  customOrders   CustomOrder[]
  referral       Referral?
  loyalty        LoyaltyTransaction[]
  registries     Registry[]
  cartItems      CartItem[]
  engravingRequests EngravingRequest[]
}

model Address {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  line1     String
  line2     String?
  city      String
  state     String
  pincode   String
  country   String   @default("India")
  isDefault Boolean  @default(false)
}

model Category {
  id           String   @id @default(cuid())
  gender       Gender
  slug         String   @unique   // zanjeer, nishaan, vaada, noor, etc.
  name         String             // custom brand name
  englishName  String             // e.g. "Rings"
  products     Product[]
}

model Product {
  id            String   @id @default(cuid())
  categoryId    String
  category      Category @relation(fields: [categoryId], references: [id])
  name          String
  slug          String   @unique
  sku           String?  @unique  // admin-typed "Product ID / SKU", distinct from id/slug — PRODUCT_MGMT_PHASE_PLAN.md Phase 2, added 2026-08-13. Nullable (Postgres allows multiple NULLs under a unique constraint); admin-only, not shown on the storefront or invoices
  price         Int                // rupees, whole integers — see "Notes" below
  images        String[]
  barcodeImage  String?            // single URL, separate from images[] — PRODUCT_MGMT_PHASE_PLAN.md Phase 1, added 2026-08-13
  material      String?
  stone         String?
  occasion      String?
  description   String?
  sizeOptions   String[]           // e.g. ["10","12","14","16","18","20"] — customer-facing (ProductDetailDrawer.tsx); kept in sync with ProductSizeStock's `size` column by the admin form, one write path
  stock         Int      @default(0) // for sizeless products (sizeOptions: []), this is the only stock number. For sized products it's what checkout still decrements today (Phase 4, not yet built) but the admin UI shows/edits ProductSizeStock instead — see that model
  isBestseller  Boolean  @default(false)
  isNew         Boolean  @default(false)
  createdAt     DateTime @default(now())
  weightGrams   Int?               // Shiprocket rate/shipment calls need package weight; nullable, lib/shiprocket.ts falls back to a conservative default when unset
  isArchived    Boolean  @default(false) // soft-delete (ADMIN_PANEL_SPEC.md §3) — a hard delete would break OrderItem history. Customer-facing queries filter this out; admin queries see and can filter on it.

  cartItems         CartItem[]
  orderItems        OrderItem[]
  wishlistedBy      WishlistItem[]
  recentViews       RecentlyViewed[]
  registryItems     RegistryItem[]
  engravingRequests EngravingRequest[]
  sizeStocks        ProductSizeStock[]
}

// Added 2026-08-13 (PRODUCT_MGMT_PHASE_PLAN.md Phase 3) — per-size admin
// inventory. A sizeless product (sizeOptions: []) has no rows here and
// Product.stock above stays its source of truth; a sized product has one row
// per sizeOptions entry. `size` is an opaque label, not a shared enum —
// whatever the category uses (ring size, chain length, etc.). Migration
// `20260813152214_add_product_size_stock` backfilled one row per existing
// sizeOptions entry at stock: 0 for products that already had sizes —
// Product.stock was left untouched, not split/divided/copied, since that
// would be inventing data; real per-size counts need entering by hand.
model ProductSizeStock {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id])
  size      String
  stock     Int     @default(0)

  @@unique([productId, size])
}

// Added 2026-08-22 (FILTER_SPEC_IMPLEMENTATION.md Part 1 — Attributes
// Manager). Migration `20260822090000_filter_attributes`. Headings are FIXED
// IN CODE per the Filter Specification — the canonical list lives in
// lib/attributes.ts and prisma/seed-attributes.ts upserts a row per key, so
// this table is not the source of truth for which headings exist. Options
// inside a heading are entirely the client's to manage at /admin/attributes.
model FilterHeading {
  id      String         @id @default(cuid())
  key     String         @unique // "finish" | "stone" | "stone_color" | "design_style" | "occasion" | "collection"
  options FilterOption[]
}

// One selectable filter value — "925 Silver", "Everyday". `sortOrder` is the
// admin's drag-to-reorder position and is what both the PLP sidebar and the
// product form's dropdowns render in.
//
// Part 1 caveat: Product.material/.stone/.occasion are still free-text
// Strings matched against `label`, so renaming an option has to rewrite every
// product carrying the old text (PATCH /api/admin/attributes/options/[id]
// does this in one transaction), and deleting an option still in use is
// refused. Part 2 of the spec replaces those columns with real FKs and both
// workarounds go away.
model FilterOption {
  id        String        @id @default(cuid())
  headingId String
  heading   FilterHeading @relation(fields: [headingId], references: [id], onDelete: Cascade)
  label     String
  sortOrder Int           @default(0)

  @@unique([headingId, label])
  @@index([headingId, sortOrder])
}

model CartItem {
  id         String   @id @default(cuid())
  userId     String?              // null for guest carts (use sessionId instead)
  user       User?    @relation(fields: [userId], references: [id])
  sessionId  String?              // guest cart identifier (cookie-based)
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  size       String?
  quantity   Int      @default(1)
  isGift     Boolean  @default(false)
  giftWrap   String?              // "signature" | "premium"
  giftNote   String?
  registryItemId String?          // set when added via a registry share link — carried to OrderItem so the Cashfree webhook can mark the RegistryItem purchased on real payment success, not before. See app/api/registry/[shareSlug]/purchase.
  stackId    String?              // groups items built via "Build Your Own Stack" into one visual card in cart (FEATURE_SPEC_BATCH2.md §3)
}

model Order {
  id                   String      @id @default(cuid())
  userId               String?
  user                 User?       @relation(fields: [userId], references: [id])
  addressId            String?     // optional pointer to a saved Address the shopper picked at checkout — NOT the source of truth, see snapshot fields below
  status               OrderStatus @default(PENDING)
  subtotal             Int
  shipping             Int         @default(0)
  total                Int
  cashfreeOrderId      String?     @unique
  shiprocketShipmentId String?
  createdAt            DateTime    @default(now())

  // Address.userId is required, so a guest checkout (guest checkout is
  // always available) has no way to own an Address row. Snapshotting
  // contact + shipping fields directly on Order also means a later edit to
  // a saved address book entry can't retroactively change where an
  // already-placed order ships — standard e-commerce practice, not just a
  // guest workaround.
  contactEmail     String
  contactPhone     String
  contactFirstName String
  contactLastName  String
  shippingLine1    String
  shippingLine2    String?
  shippingCity     String
  shippingState    String
  shippingPincode  String
  shippingCountry  String @default("India")
  deliveryMethod   String @default("STANDARD") // "STANDARD" | "EXPRESS"

  items OrderItem[]
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id])
  size      String?
  quantity  Int
  price     Int              // price at time of purchase, not live product price
  registryItemId String?     // see CartItem.registryItemId
}

model WishlistItem {
  userId    String
  user      User    @relation(fields: [userId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id])

  @@id([userId, productId])
}

model RecentlyViewed {
  id        String   @id @default(cuid())
  userId    String?
  sessionId String?
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  viewedAt  DateTime @default(now())
  User      User?    @relation(fields: [userId], references: [id])
}

model CircleMembership {
  userId        String              @id
  user          User                @relation(fields: [userId], references: [id])
  qualifiedVia  CircleQualification
  pointsBalance Int                 @default(0)
  joinedAt      DateTime            @default(now())
}
// A user with a CircleMembership row should always have User.role = CIRCLE, and
// vice versa. Set both together (e.g. in one transaction in /api/circle/join) —
// role is what route/API gating checks (fast, no extra query); CircleMembership
// holds the metadata (points, join date, how they qualified) the role alone can't.

model CustomOrder {
  id                 String            @id @default(cuid())
  userId             String
  user               User              @relation(fields: [userId], references: [id])
  referenceNumber    String            @unique
  photos             String[]          // uploaded image URLs, max 5
  jewelleryType      String            // Ring, Chain, Bracelet, Kada, Pendant, etc.
  description        String
  sizing             String?           // conditional field, stored as JSON string or separate columns
  netWeightGrams     Int?
  melting            String            // 925 Sterling, Gold-Plated 925, etc.
  budgetRange        String
  timeline           String
  contactPreference  String            // Phone, WhatsApp, Email
  status             CustomOrderStatus @default(SUBMITTED)
  quotationDetails   String?
  createdAt          DateTime          @default(now())
}

model Referral {
  userId    String   @id
  user      User     @relation(fields: [userId], references: [id])
  code      String   @unique
}

model LoyaltyTransaction {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  points    Int
  type      String              // "EARN" | "REDEEM"
  orderId   String?
  createdAt DateTime @default(now())
}

model GiftCard {
  id              String    @id @default(cuid())
  code            String    @unique
  amount          Int
  balance         Int
  isDigital       Boolean   @default(true)
  recipientName   String?
  senderName      String?
  message         String?
  deliveryDate    DateTime?
  purchasedByUserId String?

  // Buying a gift card is a real payment — GiftCard.id doubles as the
  // Cashfree order_id, same pattern as Order, so the row must exist
  // (unpaid) before the redirect and the webhook flips isPaid. The
  // code/balance aren't usable/shown as active until isPaid is true.
  isPaid          Boolean @default(false)
  buyerEmail      String  @default("")
  buyerPhone      String  @default("")
  // Physical variant only ("both digital and physical (shipped) variants")
  // — null for digital.
  shippingLine1   String?
  shippingLine2   String?
  shippingCity    String?
  shippingState   String?
  shippingPincode String?
  shippingCountry String? @default("India")
}

model Registry {
  id         String         @id @default(cuid())
  userId     String
  user       User           @relation(fields: [userId], references: [id])
  name       String
  occasion   String
  eventDate  DateTime?
  shareSlug  String         @unique
  items      RegistryItem[]
}

model RegistryItem {
  id                  String   @id @default(cuid())
  registryId          String
  registry            Registry @relation(fields: [registryId], references: [id])
  productId           String
  product             Product  @relation(fields: [productId], references: [id])
  purchased           Boolean  @default(false)
  purchasedByGuestName String?
}

model Appointment {
  id            String   @id @default(cuid())
  guestName     String
  guestContact  String
  service       String    // styling consultation, engraving, try-on
  date          DateTime
  status        String    @default("CONFIRMED")
  storeId       String    // lib/stores.ts static id — no Store model (Store Locator is out of scope, PRD.md §1)
}

model CorporateLead {
  id        String   @id @default(cuid())
  type      String            // "CORPORATE" | "BULK"
  company   String?
  contact   String
  occasion  String?
  quantity  Int?
  budget    String?
  timeline  String?
  createdAt DateTime @default(now())
}

model EngravingRequest {
  id                 String   @id @default(cuid())
  userId             String?
  user               User?    @relation(fields: [userId], references: [id])
  productId          String
  product            Product  @relation(fields: [productId], references: [id])
  message            String            // the hidden/engraved message text
  placement          String            // where on the piece, e.g. "inside band"
  contactPreference  String
  status             String   @default("REQUESTED")   // REQUESTED, CONFIRMED, IN_PRODUCTION, SHIPPED
  createdAt          DateTime @default(now())
}
```

## Notes

- **Money as integers.** Store rupees as whole integers (no paise) unless the client needs paise precision — simpler for a beginner team, avoids floating-point bugs.
- **Guest carts** use a `sessionId` cookie instead of `userId`; merge into the user's cart on login.
- **Stock locking** (see `ARCHITECTURE.md` and `lib/stock.ts`) happens in the same transaction that creates the `Order` + decrements `Product.stock` — don't decrement stock anywhere else. Restocking (order cancellation, a failed payment) goes through the same file's `restockItems()` for the identical reason.
- **HEIC photo uploads** (Custom Order) need server-side conversion to JPG before storing the URL — don't store raw HEIC, most browsers can't display it.
- **`ReturnRequest` removed 2026-08-09** (migration `20260809125745_remove_return_request`) — the Returns & Exchanges feature was cut; no returns/refund model exists in this schema anymore.
- **`Order.paymentStatus` does not exist**, despite `ADMIN_PANEL_SPEC.md` §2/§4 referring to one — payment is folded into `OrderStatus` (`PAID` and everything after it means paid). `lib/admin-orders.ts` derives a label from `status` as a stopgap; it cannot distinguish "cancelled before paying" from "paid, then cancelled." A real field, written only by the Cashfree webhook, is needed before refund reconciliation — flagged, not yet added.
