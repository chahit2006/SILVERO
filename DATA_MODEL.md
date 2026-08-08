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

enum Role {
  CUSTOMER
  CIRCLE
  ADMIN
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  phone         String?
  passwordHash  String
  firstName     String
  lastName      String
  role          Role      @default(CUSTOMER)
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

  cartItems     CartItem[]
  orderItems    OrderItem[]
  wishlistedBy  WishlistItem[]
  recentViews   RecentlyViewed[]
  registryItems RegistryItem[]
  engravingRequests EngravingRequest[]
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
  stackId    String?              // groups items built via "Build Your Own Stack" into one visual card in cart
}

model Order {
  id                  String      @id @default(cuid())
  userId              String?
  user                User?       @relation(fields: [userId], references: [id])
  addressId           String?
  status              OrderStatus @default(PENDING)
  subtotal            Int
  shipping             Int         @default(0)
  total               Int
  cashfreeOrderId     String?     @unique
  shiprocketShipmentId String?
  createdAt           DateTime    @default(now())

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
}

model WishlistItem {
  userId    String
  user      User    @relation(fields: [userId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id])

  @@id([userId, productId])
}

model RecentlyViewed {
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
