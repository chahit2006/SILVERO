"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { CartItem, Product } from "@prisma/client";
import { CartDrawer } from "@/components/shop/CartDrawer";

export type CartItemWithProduct = CartItem & { product: Product };

type AddItemInput = {
  productId: string;
  size?: string;
  quantity?: number;
  isGift?: boolean;
  giftWrap?: "signature" | "premium";
  giftNote?: string;
};

type UpdateItemInput = Partial<{
  quantity: number;
  size: string | null;
  isGift: boolean;
  giftWrap: "signature" | "premium" | null;
  giftNote: string | null;
}>;

type CartContextValue = {
  items: CartItemWithProduct[];
  subtotal: number;
  count: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addItem: (input: AddItemInput) => Promise<void>;
  updateItem: (itemId: string, data: UpdateItemInput) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

// Cart is server-persisted (NFR-1, ARCHITECTURE.md) — this context is a thin
// client-side cache over /api/cart, not the source of truth itself.
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setSubtotal(data.subtotal ?? 0);
    } catch {
      // Cart is a progressive enhancement over server state — fail quietly.
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (input: AddItemInput) => {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      await refresh();
      setIsOpen(true);
    },
    [refresh],
  );

  const updateItem = useCallback(
    async (itemId: string, data: UpdateItemInput) => {
      await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await refresh();
    },
    [refresh],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
      await refresh();
    },
    [refresh],
  );

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal,
        count,
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        addItem,
        updateItem,
        removeItem,
        refresh,
      }}
    >
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart() must be used within a CartProvider");
  return ctx;
}
