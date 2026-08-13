import type { Prisma } from "@prisma/client";
import { z } from "zod";

// CLAUDE.md constraint #4: "Stock-lock logic lives in exactly one place."
// This file is that place — don't decrement Product.stock anywhere else.
//
// ARCHITECTURE.md's checkout flow + NFR-4 + SECURITY_CHECKLIST.md §6.1:
// stock decrement happens in a DB transaction with row-level locking, so two
// customers racing to buy the last unit can't both succeed.

export class InsufficientStockError extends Error {
  constructor(
    public productId: string,
    public productName: string,
    public requested: number,
    public available: number,
  ) {
    super(`Only ${available} of "${productName}" left in stock (requested ${requested}).`);
    this.name = "InsufficientStockError";
  }
}

export type StockLineItem = { productId: string; quantity: number };

/**
 * Row-locks each product (`SELECT ... FOR UPDATE`), verifies stock is
 * sufficient, then decrements it — all inside the caller's transaction.
 * Must be called with the `tx` handle from `db.$transaction(async (tx) => ...)`,
 * never with the plain `db` client, or the lock has no transaction to hold it.
 *
 * Throws InsufficientStockError (caller should roll back / surface a 409) if
 * any item can't be fulfilled — checked for every item before decrementing
 * any of them, so a multi-item order doesn't partially decrement on failure.
 */
export async function lockAndDecrementStock(tx: Prisma.TransactionClient, items: StockLineItem[]) {
  // Lock in a stable order (by productId) — if two concurrent checkouts both
  // contain the same two products, locking in inconsistent orders is a
  // classic deadlock; a fixed sort order prevents that.
  const sorted = [...items].sort((a, b) => a.productId.localeCompare(b.productId));

  const locked = new Map<string, { name: string; stock: number }>();

  for (const item of sorted) {
    const rows = await tx.$queryRaw<{ id: string; name: string; stock: number }[]>`
      SELECT id, name, stock FROM "Product" WHERE id = ${item.productId} FOR UPDATE
    `;
    const product = rows[0];
    if (!product) {
      throw new InsufficientStockError(item.productId, "(product not found)", item.quantity, 0);
    }
    if (product.stock < item.quantity) {
      throw new InsufficientStockError(item.productId, product.name, item.quantity, product.stock);
    }
    locked.set(item.productId, product);
  }

  for (const item of sorted) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }
}

/**
 * The inverse of lockAndDecrementStock() — releases stock back for an order
 * that will never be fulfilled (a failed payment, or an admin cancellation).
 * Added 2026-08-09: the Cashfree webhook's PAYMENT_FAILED branch used to do
 * this increment inline instead of calling into this file, which quietly
 * violated the "exactly one place" rule above. Both the webhook and
 * app/api/admin/orders/[id] call this now.
 *
 * No row-locking here — incrementing stock back has no race to protect
 * against the way decrementing it does (nothing can oversell by *gaining*
 * stock), so a plain update inside the caller's transaction is enough.
 */
export async function restockItems(tx: Prisma.TransactionClient, items: StockLineItem[]) {
  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }
}

// PRODUCT_MGMT_PHASE_PLAN.md Phase 3 — "low stock" now has two definitions
// depending on the product: a sized product (has ProductSizeStock rows) is
// low if ANY size is under the threshold; a sizeless product falls back to
// the flat Product.stock field, same as before this phase. Three call sites
// need this (the admin dashboard's count, the product list's lowStock=true
// filter, and the GET /api/admin/products route) — kept here as one
// definition rather than three, in the spirit of this file already being
// "the one place" for stock logic per CLAUDE.md #4, even though this is a
// read helper rather than the lock/decrement logic that rule was written for.
export const LOW_STOCK_THRESHOLD = 5;

export function lowStockWhere(threshold = LOW_STOCK_THRESHOLD): Prisma.ProductWhereInput {
  return {
    OR: [
      { sizeStocks: { none: {} }, stock: { lt: threshold } },
      { sizeStocks: { some: { stock: { lt: threshold } } } },
    ],
  };
}

// Per-row equivalent of lowStockWhere(), for rows already fetched into JS
// (e.g. the admin ProductsTable) rather than filtered at the DB.
export function isProductLowStock(
  product: { stock: number; sizeStocks?: { stock: number }[] },
  threshold = LOW_STOCK_THRESHOLD,
): boolean {
  if (product.sizeStocks && product.sizeStocks.length > 0) {
    return product.sizeStocks.some((s) => s.stock < threshold);
  }
  return product.stock < threshold;
}

// A sized product where every size still reads its post-migration default
// of 0 hasn't had real per-size counts entered yet — distinct from "low
// stock" (which would also fire for 0) so the admin list can flag it
// specifically instead of just showing red. PRODUCT_MGMT_PHASE_PLAN.md
// Phase 3, "Migration/backfill" bullet.
export function needsSizeStockEntry(product: { sizeStocks?: { stock: number }[] }): boolean {
  return Boolean(product.sizeStocks && product.sizeStocks.length > 0 && product.sizeStocks.every((s) => s.stock === 0));
}

// PRODUCT_MGMT_PHASE_PLAN.md Phase 3 — shared by both admin product API
// routes (POST create, PATCH update). Lives here rather than duplicated in
// each route.ts, and rather than imported route-to-route (Next.js route
// files are only meant to export HTTP handlers + a small set of config
// options), same "one place" reasoning as the rest of this file.
const sizeStockRowSchema = z.object({
  size: z.string().trim().min(1).max(50), // opaque label — ring size, chain length, whatever the category uses
  stock: z.coerce.number().int().min(0),
});

/**
 * Parses+validates the JSON-encoded {size, stock}[] the admin form sends as
 * its `sizeStocks` field. De-dupes by size (last one wins) so a client-side
 * bug sending the same size twice can't hit ProductSizeStock's
 * @@unique([productId, size]). Returns `{ error }` instead of throwing so
 * callers can turn it into a 400 without a try/catch at the call site.
 */
export function parseSizeStocks(raw: string | undefined): { size: string; stock: number }[] | { error: string } {
  if (!raw) return [];
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { error: "Invalid size/stock data." };
  }
  const parsed = z.array(sizeStockRowSchema).safeParse(json);
  if (!parsed.success) return { error: "Invalid size/stock data." };
  const bySize = new Map<string, number>();
  for (const row of parsed.data) bySize.set(row.size, row.stock);
  return [...bySize.entries()].map(([size, stock]) => ({ size, stock }));
}
