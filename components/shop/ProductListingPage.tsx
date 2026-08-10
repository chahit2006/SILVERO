"use client";

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@prisma/client";
import type { NavCategory } from "@/lib/nav-data";
import type { PriceBounds, ProductFilters } from "@/lib/products";
import { SORT_OPTIONS } from "@/lib/filter-options";
import { formatPrice } from "@/lib/format";
import { ProductCard } from "./ProductCard";
import { ProductDetailDrawer } from "./ProductDetailDrawer";
import { FilterPanel, EMPTY_FILTERS, type AdjustableFilters } from "./FilterPanel";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { useCompare } from "@/components/providers/CompareProvider";
import { XIcon } from "@/components/ui/icons";

export type PLPConfig = {
  title: string;
  description?: string;
  /** Fixed by the route (gender/category/isNew/isBestseller) — not user-editable. */
  baseFilters: ProductFilters;
  /** Category checkboxes shown in the sidebar (only on hub/all-shop pages). */
  categories?: NavCategory[];
  /** Cheapest/priciest product in this view — the slider's track ends. */
  priceBounds: PriceBounds;
};

function buildSearchParams(base: ProductFilters, adjustable: AdjustableFilters, sort: string, page: number) {
  const params = new URLSearchParams();
  const category = [...(base.category ?? []), ...adjustable.category];
  if (category.length) params.set("category", category.join(","));
  if (base.gender) params.set("gender", base.gender);
  if (adjustable.material.length) params.set("material", adjustable.material.join(","));
  if (adjustable.stone.length) params.set("stone", adjustable.stone.join(","));
  if (adjustable.occasion.length) params.set("occasion", adjustable.occasion.join(","));
  if (adjustable.price) {
    params.set("minPrice", String(adjustable.price.min));
    params.set("maxPrice", String(adjustable.price.max));
  }
  if (base.isNew) params.set("isNew", "true");
  if (base.isBestseller) params.set("isBestseller", "true");
  params.set("sort", sort);
  params.set("page", String(page));
  return params;
}

// DIRECTORY_STRUCTURE.md: "10 category pages, 1 component" — this is that
// component, also reused by /shop, /shop/new, /shop/bestsellers,
// /shop/occasion, /shop/price, and the two gender hubs.
export function ProductListingPage({
  config,
  initialProducts,
  initialTotal,
}: {
  config: PLPConfig;
  initialProducts: Product[];
  initialTotal: number;
}) {
  const { ids: wishlistIds, toggle: toggleWishlist } = useWishlist();
  const { ids: compareIds, toggle: toggleCompare, isFull: compareFull } = useCompare();

  const [adjustable, setAdjustable] = useState<AdjustableFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isFirstRender, setIsFirstRender] = useState(true);

  // FEATURE_SPEC_BATCH2.md §1 recommends an explicit "Apply" on mobile rather
  // than filtering live. The sheet therefore edits its own draft copy and only
  // commits on Apply — on a phone, live-applying means every tap re-queries
  // behind a sheet the shopper can't see through, and a slider drag would fire
  // a burst of them. Desktop keeps applying immediately: the grid is visible
  // right next to the sidebar, so the feedback is the point.
  const [draft, setDraft] = useState<AdjustableFilters>(EMPTY_FILTERS);

  const fetchProducts = useCallback(
    async (nextPage: number, append: boolean) => {
      setLoading(true);
      try {
        const params = buildSearchParams(config.baseFilters, adjustable, sort, nextPage);
        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        setProducts((prev) => (append ? [...prev, ...data.products] : data.products));
        setTotal(data.total);
        setPage(nextPage);
      } finally {
        setLoading(false);
      }
    },
    [adjustable, sort, config.baseFilters],
  );

  // Skip the redundant fetch on mount — initialProducts already came from SSR.
  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }
    fetchProducts(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjustable, sort]);

  const activeTags: { label: string; onRemove: () => void }[] = [
    ...adjustable.category.map((slug) => ({
      label: config.categories?.find((c) => c.slug === slug)?.name ?? slug,
      onRemove: () => setAdjustable((f) => ({ ...f, category: f.category.filter((c) => c !== slug) })),
    })),
    ...(adjustable.price
      ? [
          {
            label: `${formatPrice(adjustable.price.min)} – ${formatPrice(adjustable.price.max)}${
              adjustable.price.max >= config.priceBounds.max ? "+" : ""
            }`,
            onRemove: () => setAdjustable((f) => ({ ...f, price: null })),
          },
        ]
      : []),
    ...adjustable.material.map((m) => ({
      label: m,
      onRemove: () => setAdjustable((f) => ({ ...f, material: f.material.filter((x) => x !== m) })),
    })),
    ...adjustable.stone.map((s) => ({
      label: s,
      onRemove: () => setAdjustable((f) => ({ ...f, stone: f.stone.filter((x) => x !== s) })),
    })),
    ...adjustable.occasion.map((o) => ({
      label: o,
      onRemove: () => setAdjustable((f) => ({ ...f, occasion: f.occasion.filter((x) => x !== o) })),
    })),
  ];

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8 lg:px-8 lg:py-12">
      <div className="mb-6">
        <h1 className="font-display text-2xl uppercase sm:text-3xl">{config.title}</h1>
        {config.description && <p className="mt-2 max-w-2xl text-sm text-text-dark/60">{config.description}</p>}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Desktop sidebar */}
        <aside className="hidden w-[200px] shrink-0 lg:block">
          <FilterPanel
            categories={config.categories}
            priceBounds={config.priceBounds}
            filters={adjustable}
            onChange={setAdjustable}
          />
        </aside>

        <div className="flex-1">
          {/* Toolbar */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <button
              // Seed the draft from what's currently applied, so reopening the
              // sheet shows the shopper's live filters rather than a blank slate.
              onClick={() => {
                setDraft(adjustable);
                setMobileFiltersOpen(true);
              }}
              className="rounded-full border border-black/15 px-4 py-2 text-xs uppercase tracking-wide lg:hidden"
            >
              Filters
              {activeTags.length > 0 && ` (${activeTags.length})`}
            </button>
            <p className="hidden text-xs text-text-dark/50 sm:block">
              Showing {products.length} of {total} products
            </p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="ml-auto rounded-full border border-black/15 px-3 py-2 text-xs uppercase tracking-wide"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {activeTags.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {activeTags.map((tag, i) => (
                <button
                  key={`${tag.label}-${i}`}
                  onClick={tag.onRemove}
                  className="flex items-center gap-1.5 rounded-full border border-black/15 px-3 py-1 text-xs"
                >
                  {tag.label}
                  <XIcon width={12} height={12} />
                </button>
              ))}
              <button
                onClick={() => setAdjustable(EMPTY_FILTERS)}
                className="text-xs uppercase tracking-wide text-text-dark/50 underline"
              >
                Clear all
              </button>
            </div>
          )}

          {products.length === 0 && !loading ? (
            <p className="py-16 text-center text-sm text-text-dark/50">No products match these filters.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  wishlisted={wishlistIds.has(product.id)}
                  onToggleWishlist={toggleWishlist}
                  onOpenDetail={setSelectedProductId}
                  comparing={compareIds.includes(product.id)}
                  onToggleCompare={toggleCompare}
                  compareDisabled={compareFull}
                />
              ))}
            </div>
          )}

          {products.length < total && (
            <div className="mt-10 flex flex-col items-center gap-2">
              <button
                onClick={() => fetchProducts(page + 1, true)}
                disabled={loading}
                className="rounded-full border border-olive-dark px-8 py-2.5 text-sm uppercase tracking-wide text-olive-dark disabled:opacity-50"
              >
                {loading ? "Loading…" : "Load more"}
              </button>
              <p className="text-xs text-text-dark/50 sm:hidden">
                Showing {products.length} of {total} products
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter bottom sheet */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            aria-label="Close filters"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-lg">Filters</p>
              <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">
                <XIcon />
              </button>
            </div>

            <FilterPanel
              categories={config.categories}
              priceBounds={config.priceBounds}
              filters={draft}
              onChange={setDraft}
            />

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setDraft(EMPTY_FILTERS)}
                className="shrink-0 text-xs uppercase tracking-wide text-text-dark/50 underline"
              >
                Clear all
              </button>
              <button
                onClick={() => {
                  setAdjustable(draft);
                  setMobileFiltersOpen(false);
                }}
                className="flex-1 rounded-full bg-olive-dark py-3 text-sm uppercase tracking-wide text-ivory"
              >
                {/* Deliberately not "Show N results": N is the count for the
                    filters currently applied, not the ones being drafted, and
                    a number that contradicts what the button is about to do is
                    worse than no number. */}
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}

      <ProductDetailDrawer
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
        onOpenDetail={setSelectedProductId}
      />
    </div>
  );
}
