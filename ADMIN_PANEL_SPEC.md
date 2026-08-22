# SILVERO.925 — Admin Panel Spec

Closes the gap flagged in `BUILD_STATUS.md`: an Admin role was always in the plan (`TECH_STACK.md`) but nothing was ever built behind it. This is that spec.

## 1. Access Control

- `Role` enum on `User` — three values: `CUSTOMER` (default) | `CIRCLE` | `ADMIN` (added to `DATA_MODEL.md`)
- Circle membership now sets `role = CIRCLE` directly (instead of a separate membership-only check) — the `CircleMembership` table still holds the extra metadata (points, join date, how they qualified), but route/API gating reads the fast `role` field. Set both together in the same transaction in `/api/circle/join`.
- No self-serve admin signup — admin accounts are created directly in the database (or via a one-off seed script) by whoever runs the project, not through the public `/register` form
- Every `/admin/*` page and every `/api/admin/*` route calls a shared `requireAdmin(session)` helper in `lib/auth.ts` — checks `role === 'ADMIN'` exactly, not "role !== CUSTOMER" (a CIRCLE member should never pass an admin check)
- Circle-gated routes (`/account/circle/custom-order`, etc.) check `role === 'CIRCLE'` — decide explicitly whether ADMIN should also pass this check (admins previewing the member experience) or not, and apply it consistently
- Non-admins hitting `/admin/*` are redirected to `/account`, not shown an error page that reveals the route exists

## 2. Dashboard (`/admin`)

Landing page after admin login. Four sections:

**Overview cards** (top row):
- Today's revenue (sum of `Order.total` where `paymentStatus = PAID` and `createdAt` is today)
- Orders today (count)
- Pending orders (count where `status = PENDING`)
- Low stock alert (count of products where `stock < 5`, threshold configurable — PRODUCT_MGMT_PHASE_PLAN.md Phase 3: for a sized product this means *any* size's stock is under the threshold, via `ProductSizeStock`, not the unused flat `Product.stock`; sizeless products still just read `stock` directly)

**Sales graph:**
- Line chart, revenue over time — toggle between Last 7 days / 30 days / 90 days
- Data source: group `Order` by day, sum `total` where paid
- Use `recharts` (already in your allowed frontend libraries) for this — simple `<LineChart>` is enough, no need for anything fancier

**Top products:**
- Bar chart or ranked list — top 5 by units sold in the selected period (`OrderItem` grouped by `productId`, summed `quantity`)

**Category breakdown:**
- Pie/donut chart — revenue share by category (Nar vs Nari, or by sub-category) for the selected period

## 3. Inventory Management (`/admin/products`)

- **List view:** table — image thumbnail, name, category, price, stock, bestseller/new badges, quick "Edit" link
- Sortable/filterable by category and stock level (e.g. "show low stock only")
- **Add product** (`/admin/products/new`) and **Edit product** (`/admin/products/[id]/edit`) — one shared form component:
  - Name, slug (auto-generated from name, editable)
  - Category (dropdown — Nar/Nari sub-categories)
  - Price, stock quantity
  - Material, stone, occasion (text/dropdown)
  - Size options (multi-select or comma list → array)
  - Description
  - Images — multi-upload, same validation approach as Custom Order photos (`SECURITY_CHECKLIST.md` §4: file signature check, size limit, random filenames)
  - isBestseller / isNew toggles
- **Delete** — soft consideration: if a product has existing `OrderItem` records, don't hard-delete (breaks order history) — either block deletion or add an `isArchived` flag instead. Recommend adding `isArchived Boolean @default(false)` to `Product` rather than true deletion.

## 4. Order Management (`/admin/orders`)

- **List view:** table — order ID, customer name/email, date, total, status, payment status
- **Filter by status** — tabs or a dropdown matching the existing `OrderStatus` enum: `PENDING` (awaiting payment) → `PAID` (in progress/processing) → `SHIPPED` → `DELIVERED` (done) → `CANCELLED`
- **Order detail** (`/admin/orders/[id]`):
  - Full item list, customer + shipping address, payment status, Cashfree order ID, Shiprocket shipment ID/tracking link
  - Manual status update (dropdown: mark as Shipped, mark as Delivered, Cancel) — for cases where Shiprocket's webhook/status sync is delayed or manual intervention is needed
  - Note: **never** let an admin manually mark something "Paid" from this screen — payment status still only changes via the Cashfree webhook (`SECURITY_CHECKLIST.md` §5). Manual overrides are for shipping/delivery status only.

## 5. Other Queues (already-modeled data, just need admin views)

| Page | Data source | Purpose |
|---|---|---|
| `/admin/circle-orders` | `CustomOrder` | Approve/reject Circle custom orders, update status through the pipeline (`SUBMITTED → ... → SHIPPED`), attach quotation details |
| `/admin/corporate-leads` | `CorporateLead` | View Corporate + Bulk leads in one list, filterable by `type` |
| `/admin/engraving-requests` | `EngravingRequest` | View/update engraving request status |

> **Removed 2026-08-09:** `/admin/returns` (`ReturnRequest`) was built per this spec and then cut along with the rest of the Returns & Exchanges feature — see `BUILD_STATUS.md`. Order cancellation still notes that refunds are processed by hand in the Cashfree dashboard (§4 above); that note is unrelated to this removed queue.

## 6. Directory Additions

```
app/admin/
├── page.tsx                       # Dashboard
├── products/
│   ├── page.tsx                   # List
│   ├── new/page.tsx
│   └── [id]/edit/page.tsx
├── orders/
│   ├── page.tsx                   # List, filterable by status
│   └── [id]/page.tsx              # Detail + manual status update
├── circle-orders/page.tsx
├── corporate-leads/page.tsx
├── engraving-requests/page.tsx
└── attributes/page.tsx            # Filter Attributes manager (FILTER_SPEC_IMPLEMENTATION.md Part 1)

app/api/admin/
├── stats/route.ts                 # Dashboard aggregates (revenue, top products, category breakdown)
├── products/route.ts              # GET list, POST create
├── products/[id]/route.ts         # GET, PATCH, (soft) DELETE
├── orders/route.ts                # GET list with status filter
├── orders/[id]/route.ts           # GET detail, PATCH status
├── circle-orders/[id]/route.ts    # PATCH status/quotation
├── corporate-leads/route.ts       # GET list
├── engraving-requests/[id]/route.ts
├── attributes/route.ts            # GET headings + options + live product counts
├── attributes/options/route.ts    # POST add an option to a (code-fixed) heading
├── attributes/options/[id]/route.ts   # PATCH rename (retags products in the same txn), DELETE (refused while in use)
└── attributes/[key]/reorder/route.ts  # PATCH full option-id list in its new order
```

## 7. Data Model Additions

Applied to `DATA_MODEL.md` **and** `prisma/schema.prisma` (migration `20260808140000_admin_role`):
- `Role` enum (`CUSTOMER`, `CIRCLE`, `ADMIN`) + `User.role @default(CUSTOMER)`
- The migration backfills existing `CircleMembership` holders to `CIRCLE`; nothing is backfilled to `ADMIN`

**Recommended, not yet applied — confirm before adding:**
- `Product.isArchived Boolean @default(false)` — for the soft-delete approach in §3
- `Order.paymentStatus` — §2 and §4 above both reference this field, but it **does not exist**;
  `OrderStatus` collapses payment and fulfilment into one value. `lib/admin-orders.ts` derives a
  payment label from `status` as a stopgap, which cannot distinguish "cancelled before paying"
  from "paid, then cancelled". Needed properly before refund reconciliation; must be written only
  by the Cashfree webhook.

## 8. Build Priority

This sits logically **after** Batch 2 (`FEATURE_SPEC_BATCH2.md`) since it's an internal tool, not customer-facing — but Order Management is worth pulling forward if the team is manually checking the database for order status right now. Suggested order:
1. Auth/role gate + `/admin/orders` (highest operational value — you need this to run the business day-to-day)
2. `/admin/products` (needed before real inventory replaces seed data)
3. Dashboard with graphs (nice-to-have once there's real order data to chart)
4. The three smaller queues (circle-orders, corporate-leads, engraving-requests) — batch these together, same shape

## Notes

- No analytics beyond what's described here (no cohort analysis, no funnel tracking) — matches the "free tools only, beginner team" constraint. If deeper analytics are wanted later, that's a GA4/external-tool conversation, not something to build into the admin panel itself.
- Charts use `recharts` — already an allowed library, no new dependency needed.
