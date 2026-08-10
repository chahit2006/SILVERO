"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Product } from "@prisma/client";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/components/providers/CartProvider";

type ResolvedSlot = { label: string; categorySlug: string; options: Product[]; defaultProductId: string | null };
type ResolvedPreset = { id: string; name: string; description: string; gender: "NAR" | "NARI"; slots: ResolvedSlot[] };

// FEATURE_SPEC_BATCH2.md §3 — starts from a preset, customer can swap any
// slot for another item in the same category, commits as one grouped unit.
export function BuildYourStack() {
  const { refresh, open } = useCart();
  const [presets, setPresets] = useState<ResolvedPreset[] | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({}); // categorySlug -> productId
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stacks/presets")
      .then((res) => res.json())
      .then((data: { presets: ResolvedPreset[] }) => {
        setPresets(data.presets);
        const first = data.presets[0];
        if (first) {
          setActivePresetId(first.id);
          setSelections(
            Object.fromEntries(
              first.slots.filter((s) => s.defaultProductId).map((s) => [s.categorySlug, s.defaultProductId!]),
            ),
          );
        }
      });
  }, []);

  const activePreset = presets?.find((p) => p.id === activePresetId);

  function switchPreset(preset: ResolvedPreset) {
    setActivePresetId(preset.id);
    setSelections(
      Object.fromEntries(preset.slots.filter((s) => s.defaultProductId).map((s) => [s.categorySlug, s.defaultProductId!])),
    );
  }

  function productFor(slot: ResolvedSlot): Product | undefined {
    return slot.options.find((p) => p.id === selections[slot.categorySlug]);
  }

  const total = activePreset
    ? activePreset.slots.reduce((sum, slot) => sum + (productFor(slot)?.price ?? 0), 0)
    : 0;

  async function handleAddStack() {
    if (!activePreset) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/stacks/${activePreset.id}/add-to-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selections: activePreset.slots.map((slot) => ({
            categorySlug: slot.categorySlug,
            productId: selections[slot.categorySlug],
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Couldn't add this stack.");
      await refresh();
      open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!presets) return <p className="text-sm text-text-dark/40">Loading…</p>;
  if (!activePreset) return <p className="text-sm text-text-dark/40">No stacks available right now.</p>;

  return (
    <div>
      <div className="mb-6 flex gap-2">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => switchPreset(p)}
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-wide ${
              p.id === activePresetId ? "border-olive-dark bg-olive-dark text-ivory" : "border-black/15"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <p className="mb-6 text-sm text-text-dark/60">{activePreset.description}</p>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="space-y-4">
        {activePreset.slots.map((slot) => {
          const current = productFor(slot);
          return (
            <div key={slot.categorySlug} className="flex items-center gap-4 rounded-card border border-black/10 p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-card bg-ivory">
                {current?.images[0] && <Image src={current.images[0]} alt="" fill className="object-cover" />}
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-text-dark/50">{slot.label}</p>
                <select
                  value={selections[slot.categorySlug] ?? ""}
                  onChange={(e) => setSelections((prev) => ({ ...prev, [slot.categorySlug]: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                >
                  {slot.options.length === 0 && <option value="">No options in stock</option>}
                  {slot.options.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatPrice(p.price)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-card bg-ivory p-4">
        <p className="text-sm">
          Stack total: <span className="font-medium">{formatPrice(total)}</span>
        </p>
        <button
          onClick={handleAddStack}
          disabled={submitting}
          className="rounded-full bg-olive-dark px-6 py-2.5 text-sm uppercase tracking-wide text-ivory disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Add Stack to Bag"}
        </button>
      </div>
    </div>
  );
}
