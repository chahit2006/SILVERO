"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { formatPrice } from "@/lib/format";
import { XIcon } from "@/components/ui/icons";

// DESIGN_SYSTEM.md §8 "Cart Drawer".
export function CartDrawer() {
  const { items, subtotal, isOpen, close, updateItem, removeItem } = useCart();
  const [promoOpen, setPromoOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        aria-label="Close cart"
        className="absolute inset-0 animate-fade-in bg-black/40"
        onClick={close}
      />

      <div className="absolute right-0 top-0 flex h-full w-full max-w-cart-drawer animate-slide-in-right flex-col bg-white">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <h2 className="font-display text-lg">Your Bag</h2>
          <button aria-label="Close cart" onClick={close} className="p-1">
            <XIcon />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-text-dark/60">Your bag is empty. Explore our collections.</p>
            <Link
              href="/shop"
              onClick={close}
              className="rounded-full bg-olive-dark px-6 py-2.5 text-sm uppercase tracking-wide text-ivory"
            >
              Explore
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto divide-y divide-black/5 px-5">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 py-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-card bg-ivory">
                    {item.product.images[0] && (
                      <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <button
                        aria-label="Remove item"
                        onClick={() => removeItem(item.id)}
                        className="text-text-dark/40 hover:text-text-dark"
                      >
                        <XIcon width={14} height={14} />
                      </button>
                    </div>
                    {item.product.material && (
                      <p className="text-xs text-text-dark/50">{item.product.material}</p>
                    )}
                    {item.size && <p className="text-xs text-text-dark/50">Size: {item.size}</p>}

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-black/10">
                        <button
                          aria-label="Decrease quantity"
                          className="px-2.5 py-1 text-sm"
                          onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <button
                          aria-label="Increase quantity"
                          className="px-2.5 py-1 text-sm"
                          onClick={() => updateItem(item.id, { quantity: Math.min(10, item.quantity + 1) })}
                        >
                          +
                        </button>
                      </div>
                      <p className="text-sm font-medium">{formatPrice(item.product.price * item.quantity)}</p>
                    </div>

                    <label className="mt-2 flex items-center gap-2 text-xs text-text-dark/60">
                      <input
                        type="checkbox"
                        checked={item.isGift}
                        onChange={(e) => updateItem(item.id, { isGift: e.target.checked })}
                      />
                      This is a gift
                    </label>
                    {item.isGift && (
                      <input
                        type="text"
                        maxLength={200}
                        placeholder="Add a gift note"
                        defaultValue={item.giftNote ?? ""}
                        onBlur={(e) => updateItem(item.id, { giftNote: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-black/10 px-2 py-1 text-xs outline-none"
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-black/10 px-5 py-4 space-y-3">
              <button
                onClick={() => setPromoOpen((v) => !v)}
                className="text-xs uppercase tracking-wide text-text-dark/60 link-underline"
              >
                Have a code?
              </button>
              {promoOpen && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Promo code"
                    className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none"
                  />
                  <button className="rounded-lg border border-black/10 px-3 text-sm">Apply</button>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-text-dark/60">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-text-dark/50">Complimentary shipping across India.</p>

              <Link
                href="/checkout"
                onClick={close}
                className="block w-full rounded-full bg-olive-dark py-3 text-center text-sm uppercase tracking-wide text-ivory transition-colors duration-150 hover:bg-olive-dark/90"
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
