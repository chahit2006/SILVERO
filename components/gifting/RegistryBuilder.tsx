"use client";

import { useState } from "react";
import Image from "next/image";
import type { Product } from "@prisma/client";
import { formatPrice } from "@/lib/format";

// PRD.md §4 "Jewellery Registry" — logged-in creation, generates a
// shareSlug for the guest-accessible public view.
export function RegistryBuilder({ onCreated }: { onCreated: (shareSlug: string) => void }) {
  const [name, setName] = useState("");
  const [occasion, setOccasion] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function search(q: string) {
    setQuery(q);
    if (!q.trim()) return setResults([]);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      setResults(data.products ?? []);
    }
  }

  function addProduct(product: Product) {
    if (selected.some((p) => p.id === product.id)) return;
    setSelected((prev) => [...prev, product]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (selected.length === 0) {
      setError("Add at least one item to the registry.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          occasion,
          eventDate: eventDate ? new Date(eventDate).toISOString() : undefined,
          productIds: selected.map((p) => p.id),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");
      onCreated(data.registry.shareSlug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <input required placeholder="Registry name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        <input required placeholder="Occasion (e.g. Wedding)" value={occasion} onChange={(e) => setOccasion(e.target.value)} className={inputClass} />
      </div>
      <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputClass} />

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-text-dark/60">Add items</p>
        <input placeholder="Search products…" value={query} onChange={(e) => search(e.target.value)} className={inputClass} />
        {results.length > 0 && (
          <ul className="mt-2 divide-y divide-black/5 rounded-lg border border-black/10">
            {results.map((p) => (
              <li key={p.id} className="flex items-center justify-between p-2 text-sm">
                <span>
                  {p.name} — {formatPrice(p.price)}
                </span>
                <button type="button" onClick={() => addProduct(p)} className="text-xs uppercase tracking-wide text-olive-dark underline">
                  Add
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-text-dark/60">{selected.length} item(s) added</p>
          <div className="flex flex-wrap gap-2">
            {selected.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-full border border-black/10 py-1 pl-1 pr-3 text-xs">
                <div className="relative h-6 w-6 overflow-hidden rounded-full bg-ivory">
                  {p.images[0] && <Image src={p.images[0]} alt="" fill className="object-cover" />}
                </div>
                {p.name}
                <button type="button" onClick={() => setSelected((prev) => prev.filter((x) => x.id !== p.id))}>
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button type="submit" disabled={submitting} className="rounded-full bg-olive-dark px-6 py-2.5 text-sm uppercase tracking-wide text-ivory disabled:opacity-50">
        {submitting ? "Creating…" : "Create Registry"}
      </button>
    </form>
  );
}

const inputClass = "w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-olive-dark";
