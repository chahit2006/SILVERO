"use client";

import { useEffect, useState } from "react";
import type { PriceBounds } from "@/lib/products";
import { formatPrice } from "@/lib/format";

export type PriceRange = { min: number; max: number };

const STEP = 100;

/**
 * FEATURE_SPEC_BATCH2.md §1 — "range slider (min/max), not just preset
 * buckets — drag-to-select like H&M's price filter". Replaces the preset
 * ₹0–2K/2K–5K/… bands that DESIGN_SYSTEM.md §6 originally specified; the
 * client's 2026-08-08 direction supersedes that.
 *
 * Two native range inputs share one track. `onCommit` fires on release, not
 * on every pixel of the drag — the spec calls out re-fetching on every slider
 * movement as the thing to avoid, and a drag across the rail would otherwise
 * fire dozens of queries and race their responses into the grid.
 */
export function PriceRangeSlider({
  bounds,
  value,
  onCommit,
}: {
  bounds: PriceBounds;
  value: PriceRange | null;
  onCommit: (next: PriceRange | null) => void;
}) {
  // Every product in this view costs the same (or there are none) — a slider
  // with no span to drag is just a confusing decoration.
  const inert = bounds.max <= bounds.min;

  const [draft, setDraft] = useState<PriceRange>(value ?? bounds);

  // Re-sync when the committed value changes from outside — "Clear all" and
  // the dismissible filter tags both reset to null, and the handles have to
  // spring back to the ends when they do.
  useEffect(() => {
    setDraft(value ?? bounds);
  }, [value, bounds]);

  if (inert) return null;

  function commit(next: PriceRange) {
    // Spanning the full catalogue is the same as no price filter at all.
    // Reporting null keeps it out of the query string and stops a "₹500 –
    // ₹9,000" tag appearing above the grid when nothing is actually filtered.
    const isFullRange = next.min <= bounds.min && next.max >= bounds.max;
    onCommit(isFullRange ? null : next);
  }

  // The thumbs must not cross. Clamping to one STEP apart rather than to each
  // other's exact value leaves them separately grabbable when they meet.
  function setLow(raw: number) {
    setDraft((d) => ({ ...d, min: Math.min(raw, d.max - STEP) }));
  }
  function setHigh(raw: number) {
    setDraft((d) => ({ ...d, max: Math.max(raw, d.min + STEP) }));
  }

  const span = bounds.max - bounds.min;
  const leftPct = ((draft.min - bounds.min) / span) * 100;
  const rightPct = ((bounds.max - draft.max) / span) * 100;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-text-dark/80">
        <span>{formatPrice(draft.min)}</span>
        <span>
          {formatPrice(draft.max)}
          {draft.max >= bounds.max && "+"}
        </span>
      </div>

      <div className="relative h-4">
        {/* Rail */}
        <div className="absolute inset-x-0 top-0 h-1.5 rounded-full bg-black/10" />
        {/* Selected span */}
        <div
          className="absolute top-0 h-1.5 rounded-full bg-olive-dark"
          style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
        />

        <input
          type="range"
          className="range-thumb"
          min={bounds.min}
          max={bounds.max}
          step={STEP}
          value={draft.min}
          aria-label="Minimum price"
          aria-valuetext={formatPrice(draft.min)}
          onChange={(e) => setLow(Number(e.target.value))}
          onPointerUp={() => commit(draft)}
          onKeyUp={() => commit(draft)}
          onBlur={() => commit(draft)}
        />
        <input
          type="range"
          className="range-thumb"
          min={bounds.min}
          max={bounds.max}
          step={STEP}
          value={draft.max}
          aria-label="Maximum price"
          aria-valuetext={formatPrice(draft.max)}
          onChange={(e) => setHigh(Number(e.target.value))}
          onPointerUp={() => commit(draft)}
          onKeyUp={() => commit(draft)}
          onBlur={() => commit(draft)}
        />
      </div>
    </div>
  );
}
