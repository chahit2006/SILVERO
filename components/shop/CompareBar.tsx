"use client";

import { useRouter } from "next/navigation";
import { useCompare, MAX_COMPARE } from "@/components/providers/CompareProvider";

// Floating bar — appears once at least one item is queued for comparison.
// Rendered once at the layout level (not per-PLP), same pattern as
// CartDrawer being mounted once by CartProvider.
export function CompareBar() {
  const { ids, clear } = useCompare();
  const router = useRouter();

  if (ids.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-black/10 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <p className="text-sm">
          {ids.length} of {MAX_COMPARE} selected to compare
        </p>
        <div className="flex items-center gap-3">
          <button onClick={clear} className="text-xs uppercase tracking-wide text-text-dark/50 underline">
            Clear
          </button>
          <button
            onClick={() => router.push(`/compare?ids=${ids.join(",")}`)}
            disabled={ids.length < 2}
            className="rounded-full bg-olive-dark px-6 py-2.5 text-sm uppercase tracking-wide text-ivory disabled:opacity-40"
          >
            Compare
          </button>
        </div>
      </div>
    </div>
  );
}
