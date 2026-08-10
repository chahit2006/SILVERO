// FEATURE_SPEC_BATCH2.md §3 "Build Your Own Stack" — "since these are
// curated/content, not something customers create, store them as seed data
// (a JSON config...); JSON is faster to ship for a beginner team [than a
// StackPreset table]" — this is that JSON config, per the spec's own
// recommendation. Slots reference category *slugs* (stable across reseeds),
// not product ids (seeded products get fresh cuids every run) — resolved to
// real products at request time by /api/stacks/presets.
export type StackPresetSlot = { label: string; categorySlug: string };
export type StackPreset = {
  id: string;
  name: string;
  description: string;
  gender: "NAR" | "NARI";
  slots: StackPresetSlot[];
};

export const STACK_PRESETS: StackPreset[] = [
  {
    id: "everyday-nar",
    name: "Everyday Stack — Nar",
    description: "A chain, a ring, and a kada — the basics, done right.",
    gender: "NAR",
    slots: [
      { label: "Chain", categorySlug: "zanjeer" },
      { label: "Ring", categorySlug: "nishaan" },
      { label: "Kada", categorySlug: "sankalp" },
    ],
  },
  {
    id: "everyday-nari",
    name: "Everyday Stack — Nari",
    description: "A chain, a ring, and a bracelet — layer-ready, worn together or apart.",
    gender: "NARI",
    slots: [
      { label: "Chain", categorySlug: "resham" },
      { label: "Ring", categorySlug: "vaada" },
      { label: "Bracelet", categorySlug: "kalai" },
    ],
  },
];

export function getStackPreset(id: string): StackPreset | undefined {
  return STACK_PRESETS.find((p) => p.id === id);
}
