import type { Prisma } from "@prisma/client";

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
