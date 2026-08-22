"use client";

import { useState } from "react";
import type { NavCategory } from "@/lib/nav-data";
import type { PriceBounds } from "@/lib/products";
import type { PlpFilterGroup } from "@/lib/attributes";
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
//
// Material/Stone/Occasion are no longer hardcoded here. They arrive as
// `groups`, built server-side by getPlpFilterGroups() from the Attributes
// Manager — admin order, and only options at least one product in this view
// actually carries (FILTER_SPEC_IMPLEMENTATION.md Part 1, "hide-when-empty").
export function FilterPanel({
  categories,
  groups,
  priceBounds,
  filters,
  onChange,
}: {
  categories?: NavCategory[];
  groups: PlpFilterGroup[];
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

      {groups.map((group) => (
        <Section key={group.key} title={group.title}>
          {group.options.map((option) => (
            <Checkbox
              key={option}
              label={option}
              checked={filters[group.queryKey].includes(option)}
              onChange={() =>
                onChange({ ...filters, [group.queryKey]: toggle(filters[group.queryKey], option) })
              }
            />
          ))}
        </Section>
      ))}
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
