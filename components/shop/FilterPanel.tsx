"use client";

import { useState } from "react";
import type { NavCategory } from "@/lib/nav-data";
import type { PriceBounds } from "@/lib/products";
import { MATERIAL_OPTIONS, OCCASION_OPTIONS, STONE_OPTIONS } from "@/lib/filter-options";
import { ChevronDownIcon } from "@/components/ui/icons";
import { PriceRangeSlider, type PriceRange } from "./PriceRangeSlider";

export type AdjustableFilters = {
  category: string[];
  material: string[];
  stone: string[];
  occasion: string[];
  /** null = no price filter (the slider spans the whole catalogue). */
  price: PriceRange | null;
};

export const EMPTY_FILTERS: AdjustableFilters = {
  category: [],
  material: [],
  stone: [],
  occasion: [],
  price: null,
};

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// DESIGN_SYSTEM.md §6 "PLP" — each filter group is a collapsible section
// with checkboxes. Price is the exception: FEATURE_SPEC_BATCH2.md §1 replaced
// the original preset bands with a drag-to-select range slider.
export function FilterPanel({
  categories,
  priceBounds,
  filters,
  onChange,
}: {
  categories?: NavCategory[];
  priceBounds: PriceBounds;
  filters: AdjustableFilters;
  onChange: (next: AdjustableFilters) => void;
}) {
  return (
    <div className="divide-y divide-black/10">
      {categories && categories.length > 0 && (
        <Section title="Category">
          {categories.map((cat) => (
            <Checkbox
              key={cat.slug}
              label={cat.name}
              checked={filters.category.includes(cat.slug)}
              onChange={() => onChange({ ...filters, category: toggle(filters.category, cat.slug) })}
            />
          ))}
        </Section>
      )}

      <Section title="Price Range">
        <PriceRangeSlider
          bounds={priceBounds}
          value={filters.price}
          onCommit={(price) => onChange({ ...filters, price })}
        />
      </Section>

      <Section title="Material">
        {MATERIAL_OPTIONS.map((m) => (
          <Checkbox
            key={m}
            label={m}
            checked={filters.material.includes(m)}
            onChange={() => onChange({ ...filters, material: toggle(filters.material, m) })}
          />
        ))}
      </Section>

      <Section title="Stone">
        {STONE_OPTIONS.map((s) => (
          <Checkbox
            key={s}
            label={s}
            checked={filters.stone.includes(s)}
            onChange={() => onChange({ ...filters, stone: toggle(filters.stone, s) })}
          />
        ))}
      </Section>

      <Section title="Occasion">
        {OCCASION_OPTIONS.map((o) => (
          <Checkbox
            key={o}
            label={o}
            checked={filters.occasion.includes(o)}
            onChange={() => onChange({ ...filters, occasion: toggle(filters.occasion, o) })}
          />
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="py-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-xs uppercase tracking-wide text-text-dark/70"
      >
        {title}
        <ChevronDownIcon
          width={14}
          height={14}
          className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-3 space-y-2.5">{children}</div>}
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-text-dark/80">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-olive-dark" />
      {label}
    </label>
  );
}
