import Link from "next/link";
import { db } from "@/lib/db";
import { ProductsTable } from "@/components/admin/ProductsTable";

export const dynamic = "force-dynamic";

// ADMIN_PANEL_SPEC.md §3 — list view, sortable/filterable by category and
// stock level. requireAdmin() already ran in app/admin/layout.tsx.
export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; lowStock?: string; archived?: string };
}) {
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: {
        ...(searchParams.category ? { categoryId: searchParams.category } : {}),
        ...(searchParams.lowStock === "true" ? { stock: { lt: 5 } } : {}),
        ...(searchParams.archived === "true" ? {} : { isArchived: false }),
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    db.category.findMany({ orderBy: { englishName: "asc" } }),
  ]);

  const qs = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { category: searchParams.category, lowStock: searchParams.lowStock, archived: searchParams.archived, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    return `?${params.toString()}`;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-xl">Products</h2>
        <Link href="/admin/products/new" className="rounded-full bg-olive-dark px-5 py-2 text-xs uppercase tracking-wide text-ivory">
          Add Product
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <Link href={qs({ category: undefined })} className={`rounded-full border px-3 py-1 ${!searchParams.category ? "border-olive-dark text-olive-dark" : "border-black/15"}`}>
          All categories
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={qs({ category: c.id })}
            className={`rounded-full border px-3 py-1 ${searchParams.category === c.id ? "border-olive-dark text-olive-dark" : "border-black/15"}`}
          >
            {c.name}
          </Link>
        ))}
        <span className="mx-1 text-black/20">|</span>
        <Link href={qs({ lowStock: searchParams.lowStock === "true" ? undefined : "true" })} className={`rounded-full border px-3 py-1 ${searchParams.lowStock === "true" ? "border-red-400 text-red-700" : "border-black/15"}`}>
          Low stock only
        </Link>
        <Link href={qs({ archived: searchParams.archived === "true" ? undefined : "true" })} className={`rounded-full border px-3 py-1 ${searchParams.archived === "true" ? "border-olive-dark text-olive-dark" : "border-black/15"}`}>
          Show archived
        </Link>
      </div>

      <ProductsTable products={products} />
    </div>
  );
}
