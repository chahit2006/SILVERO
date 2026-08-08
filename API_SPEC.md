# SILVERO.925 — API Specification

All routes are Next.js API Routes under `app/api/`. Auth-gated routes must check the session server-side — never trust a client-side "isLoggedIn" flag alone.

## Auth
| Route | Method | Notes |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handler — login, session, logout |
| `/api/auth/register` | POST | **Added 2026-08-08, wasn't originally documented here.** NextAuth's credentials provider verifies logins but has no built-in account-creation endpoint — this is what inserts the `User` row (bcrypt hash, zod-validated, rate-limited). |

## Products & Categories
| Route | Method | Notes |
|---|---|---|
| `/api/categories` | GET | List all categories, optionally filtered by `gender` |
| `/api/products` | GET | List/filter products — query params: `category`, `price`, `material`, `stone`, `occasion`, `sort` |
| `/api/products/[id]` | GET | Single product detail (used by the drawer/modal) |
| `/api/search` | GET | Search products by query string |

## Cart
| Route | Method | Notes |
|---|---|---|
| `/api/cart` | GET | Get current cart (by session or user) |
| `/api/cart` | POST | Add item |
| `/api/cart/[itemId]` | PATCH | Update quantity/size/gift options |
| `/api/cart/[itemId]` | DELETE | Remove item |

## Checkout & Payments
| Route | Method | Notes |
|---|---|---|
| `/api/checkout` | POST | Create order (PENDING), lock + decrement stock in one transaction |
| `/api/cashfree/create-order` | POST | Create the Cashfree payment session for the order |
| `/api/cashfree/webhook` | POST | **Source of truth for "paid."** Verify signature, update order status, trigger Shiprocket |
| `/api/shiprocket/rates` | GET | Shipping cost estimate for checkout |
| `/api/shiprocket/create-shipment` | POST | Called internally after payment confirmation, not by the client |

## Account
| Route | Method | Notes |
|---|---|---|
| `/api/account/orders` | GET | Order history for logged-in user |
| `/api/account/orders/[id]` | GET | Order detail + tracking |
| `/api/account/addresses` | GET/POST/PATCH/DELETE | Address book |
| `/api/account/wishlist` | GET/POST/DELETE | Wishlist |
| `/api/account/returns` | GET/POST | Return requests |
| `/api/recently-viewed` | GET/POST | **Added 2026-08-08, wasn't originally documented here.** Backs `/account/recently-viewed` — GET reads, POST records a view. Scoped to the logged-in user or the guest cart cookie (`lib/cart.ts`), same identity as the cart. |

## SILVERO Circle & Custom Order
| Route | Method | Notes |
|---|---|---|
| `/api/circle/join` | POST | Join Circle (free-via-purchase or paid path) |
| `/api/circle/status` | GET | Membership status/points for logged-in user |
| `/api/circle/custom-order` | POST | **Server-side membership check required.** Accepts form + photo uploads |
| `/api/circle/custom-order/[id]` | GET | Status lookup for the logged-in member's own submission |

## Gifting
| Route | Method | Notes |
|---|---|---|
| `/api/gift-cards` | POST | Purchase a gift card |
| `/api/gift-cards/[code]` | GET | Validate/check balance |
| `/api/registry` | POST | Create a registry |
| `/api/registry/[shareSlug]` | GET | Public registry view (guest-accessible) |
| `/api/registry/[shareSlug]/purchase` | POST | Guest marks an item purchased |

## Services & Leads
| Route | Method | Notes |
|---|---|---|
| `/api/appointments` | POST | Book an appointment |
| `/api/corporate-leads` | POST | Corporate gifting / bulk order quote request |

## Conventions
- All mutating routes validate input server-side (don't rely on frontend validation alone).
- Error responses: `{ error: string }` with an appropriate HTTP status — keep this consistent across every route so the frontend can handle errors generically.
- Every route that touches money, stock, or Circle membership needs a server-side check — this is the #1 place beginner mistakes turn into real bugs (see `ARCHITECTURE.md` NFR notes).
