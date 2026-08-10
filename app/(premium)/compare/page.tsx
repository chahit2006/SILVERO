import { CompareTable } from "@/components/shop/CompareTable";

// FEATURE_SPEC_BATCH2.md §2 — /compare?ids=<id1>,<id2>, shareable via URL.
export default function ComparePage({ searchParams }: { searchParams: { ids?: string } }) {
  const ids = (searchParams.ids ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-16 lg:px-8">
      <h1 className="mb-8 font-display text-3xl">Compare</h1>
      {ids.length < 2 ? (
        <p className="text-sm text-text-dark/60">
          Select at least 2 products to compare from any shop page — look for the &ldquo;Compare&rdquo;
          checkbox under a product.
        </p>
      ) : (
        <CompareTable ids={ids} />
      )}
    </div>
  );
}
