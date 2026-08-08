"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type WishlistContextValue = {
  ids: Set<string>;
  count: number;
  toggle: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

// WishlistItem requires a real account (DATA_MODEL.md — no guest path), so
// toggling while logged out sends the shopper to login instead of silently
// no-op'ing.
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const [ids, setIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (status !== "authenticated") {
      setIds(new Set());
      return;
    }
    try {
      const res = await fetch("/api/account/wishlist");
      if (!res.ok) return;
      const data = await res.json();
      setIds(new Set((data.items ?? []).map((i: { productId: string }) => i.productId)));
    } catch {
      // best-effort
    }
  }, [status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (productId: string) => {
      if (status !== "authenticated") {
        router.push("/account/login");
        return;
      }

      const wasWishlisted = ids.has(productId);
      setIds((prev) => {
        const next = new Set(prev);
        wasWishlisted ? next.delete(productId) : next.add(productId);
        return next;
      });

      await fetch("/api/account/wishlist", {
        method: wasWishlisted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      }).catch(() => refresh()); // roll back to server truth on failure
    },
    [status, ids, router, refresh],
  );

  return (
    <WishlistContext.Provider value={{ ids, count: ids.size, toggle, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist() must be used within a WishlistProvider");
  return ctx;
}
