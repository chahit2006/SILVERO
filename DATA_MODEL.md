# SILVERO.925 — Data Model

Prisma schema covering every entity implied by the IA. Beginner-friendly starting point — extend fields as features get built, don't feel obligated to build every relation on day one.

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

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  phone         String?
  passwordHash  String
  firstName     String
  lastName      String
  createdAt     DateTime  @default(now())

  addresses     Address[]
  orders        Order[]
  wishlist      WishlistItem[]
  recentlyViewed RecentlyViewed[]
  circle        CircleMembership?
  customOrders  CustomOrder[]
  referral      Referral?
  loyalty       LoyaltyTransaction[]
  registries    Registry[]
  cartItems     CartItem[]
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
  price         Int                // paise or rupees — pick one convention, be consistent
  images        String[]
  material      String?
  stone         String?
  occasion      String?
  description   String?
  sizeOptions   String[]           // e.g. ["10","12","14","16","18","20"]
  stock         Int      @default(0)
  isBestseller  Boolean  @default(false)
  isNew         Boolean  @default(false)
  createdAt     DateTime @default(now())
  weightGrams   Int? // added 2026-08-08 (Phase 2) — see "Notes" below

  cartItems     CartItem[]
  orderItems    OrderItem[]
  wishlistedBy  WishlistItem[]
  recentViews   RecentlyViewed[]
  registryItems RegistryItem[]
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
  registryItemId String? // added 2026-08-08 (Phase 2 Gifting) — see "Notes"
}

model Order {
  id                  String      @id @default(cuid())
  userId              String?
  user                User?       @relation(fields: [userId], references: [id])
  addressId           String? // optional pointer to a saved Address — not the source of truth, see snapshot fields below
  status              OrderStatus @default(PENDING)
  subtotal            Int
  shipping             Int         @default(0)
  total               Int
  cashfreeOrderId     String?     @unique
  shiprocketShipmentId String?
  createdAt           DateTime    @default(now())

  // Added 2026-08-08 (Phase 2 checkout) — see "Notes" below.
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

  items               OrderItem[]
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
  registryItemId String? // see CartItem.registryItemId
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

  // Added 2026-08-08 (Phase 2 Gifting) — see "Notes"
  isPaid       Boolean @default(false)
  buyerEmail   String  @default("")
  buyerPhone   String  @default("")
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

model ReturnRequest {
  id            String   @id @default(cuid())
  orderId       String
  itemIds       String[]
  reason        String
  refundMethod  String
  status        String   @default("REQUESTED")   // REQUESTED, APPROVED, SHIPPED, RECEIVED, REFUNDED
  createdAt     DateTime @default(now())
}
```

## Notes

- **Money as integers.** Store rupees as whole integers (no paise) unless the client needs paise precision — simpler for a beginner team, avoids floating-point bugs.
- **Guest carts** use a `sessionId` cookie instead of `userId`; merge into the user's cart on login.
- **Stock locking** (see `ARCHITECTURE.md`) happens in the same transaction that creates the `Order` + decrements `Product.stock` — don't decrement stock anywhere else.
- **HEIC photo uploads** (Custom Order) need server-side conversion to JPG before storing the URL — don't store raw HEIC, most browsers can't display it.
- **`RecentlyViewed.id`** was added (2026-08-08) — the model as originally drafted had no unique identifier, which Prisma requires on every model (`prisma generate` fails without one). Added an `id String @id @default(cuid())` field to match every other model's pattern.
- **`Order` contact/shipping snapshot fields** were added (2026-08-08, Phase 2 checkout) — `Address.userId` is required, so a guest checkout (DESIGN_SYSTEM.md §8 requires this) had no way to attach a shipping address to an order under the original schema. Rather than make `Address.userId` optional (which would weaken the account address book), Order now stores its own contact/shipping snapshot — also the correct e-commerce pattern regardless of guest/logged-in, since an order's shipping details shouldn't retroactively change if the address book entry is later edited.
- **`Product.weightGrams`** was added (2026-08-08, Phase 2 Shiprocket integration) — Shiprocket's rate and shipment-creation APIs require package weight, and no field carried it. Nullable; `lib/shiprocket.ts` falls back to a conservative flat default per item when unset, rather than failing. Real per-product weights should be backfilled before launch for accurate rates.
- **`GiftCard` payment/shipping fields** were added (2026-08-08, Phase 2 Gifting) — buying a gift card is a real Cashfree payment, same pattern as `Order`: the row is created unpaid first (`GiftCard.id` doubles as the Cashfree `order_id`) and the webhook flips `isPaid` on success. Shipping fields are null for digital cards, populated for physical ones.
- **`CartItem.registryItemId` / `OrderItem.registryItemId`** were added (2026-08-08, Phase 2 Gifting) — PRD.md §4: "guest checkout can fulfill items on someone else's registry." Rather than a `/purchase` endpoint that just flips `RegistryItem.purchased` on click (which would mark something "purchased" with no actual payment happening), a registry item is added to the guest's cart tagged with this field, goes through the real checkout + Cashfree webhook, and only then gets marked purchased — see `app/api/registry/[shareSlug]/purchase` and the webhook's registry branch.
