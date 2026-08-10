"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "silvero_compare";
const MAX_COMPARE = 4;

// FEATURE_SPEC_BATCH2.md §2 "Compare" — "entirely client-side/stateless —
// no new database model." Session storage while a shopper is building their
// selection across PLP pages; the /compare page itself reads/writes real
// URL query params (`?ids=`) so that specific comparison is shareable, per
// the spec's "URL query params (shareable, survives refresh) or session
// storage" — this is deliberately both, at different stages of the flow.
type CompareContextValue = {
  ids: string[];
  toggle: (productId: string) => void;
  clear: () => void;
  isFull: boolean;
};

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) setIds(JSON.parse(stored));
    } catch {
      // corrupt/blocked storage — just start empty
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return; // don't clobber storage with the initial empty state before it's loaded
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // ignore — comparison just won't persist across a refresh
    }
  }, [ids, hydrated]);

  function toggle(productId: string) {
    setIds((prev) => {
      if (prev.includes(productId)) return prev.filter((id) => id !== productId);
      if (prev.length >= MAX_COMPARE) return prev; // silently ignore — CompareBar shows the cap
      return [...prev, productId];
    });
  }

  function clear() {
    setIds([]);
  }

  return (
    <CompareContext.Provider value={{ ids, toggle, clear, isFull: ids.length >= MAX_COMPARE }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare() must be used within a CompareProvider");
  return ctx;
}

export { MAX_COMPARE };
