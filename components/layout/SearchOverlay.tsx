"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { popularSearches } from "@/lib/nav-data";
import { SearchIcon, XIcon } from "@/components/ui/icons";

type ProductSuggestion = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image?: string;
};

// DESIGN_SYSTEM.md §4 "Search Overlay".
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => {
        clearTimeout(t);
        document.body.style.overflow = "";
      };
    }
    setQuery("");
    setResults([]);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Predictive results — hits /api/search (API_SPEC.md), once it's built.
  // Fails silently until then so the overlay still works standalone.
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        setResults(Array.isArray(data?.products) ? data.products.slice(0, 6) : []);
      } catch {
        // /api/search isn't built yet, or the request was aborted — ignore.
      }
    }, 250);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] animate-fade-in bg-black/60 backdrop-blur-sm">
      <button
        aria-label="Close search"
        className="absolute inset-0"
        onClick={onClose}
        tabIndex={-1}
      />

      <div className="relative mx-auto mt-[10vh] w-[min(92vw,640px)] rounded-card bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-black/10 pb-4">
          <SearchIcon className="text-text-dark/50" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="What are you looking for?"
            className="flex-1 bg-transparent font-display text-lg outline-none placeholder:text-text-dark/40"
          />
          <button aria-label="Close search" onClick={onClose} className="p-1">
            <XIcon />
          </button>
        </div>

        <div className="pt-5">
          {query.trim() ? (
            results.length > 0 ? (
              <ul className="space-y-3">
                {results.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/shop?highlight=${product.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-ivory transition-colors duration-150"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-card bg-ivory">
                        {product.image && (
                          <Image src={product.image} alt="" fill className="object-cover" />
                        )}
                      </div>
                      <span className="flex-1 text-sm">{product.name}</span>
                      <span className="text-sm text-text-dark/60">₹{product.price}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-dark/50">No results yet for “{query}”.</p>
            )
          ) : (
            <div>
              <p className="mb-3 text-xs uppercase tracking-wide text-text-dark/50">
                Popular searches
              </p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="rounded-full border border-black/10 px-4 py-1.5 text-sm hover:border-olive-dark hover:text-olive-dark transition-colors duration-150"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
