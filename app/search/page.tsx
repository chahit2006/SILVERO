import { searchProducts } from "@/lib/search";
import { SearchResultsGrid } from "@/components/search/SearchResultsGrid";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q ?? "";
  const products = q ? await searchProducts(q) : [];

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-10 lg:px-8">
      <h1 className="mb-6 font-display text-2xl">
        {q ? (
          <>
            Results for &ldquo;{q}&rdquo; <span className="text-text-dark/40">({products.length})</span>
          </>
        ) : (
          "Search"
        )}
      </h1>

      {q && products.length === 0 ? (
        <p className="text-sm text-text-dark/50">No products match &ldquo;{q}&rdquo;.</p>
      ) : (
        <SearchResultsGrid products={products} />
      )}
    </div>
  );
}
