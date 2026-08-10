"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Product } from "@prisma/client";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/components/providers/CartProvider";

const ROWS: { label: string; render: (p: Product) => React.ReactNode }[] = [
  { label: "Price", render: (p) => formatPrice(p.price) },
  { label: "Material", render: (p) => p.material ?? "—" },
  { label: "Stone", render: (p) => p.stone ?? "—" },
  { label: "Occasion", render: (p) => p.occasion ?? "—" },
  { label: "Sizes", render: (p) => (p.sizeOptions.length ? p.sizeOptions.join(", ") : "—") },
  { label: "Description", render: (p) => p.description ?? "—" },
];

// FEATURE_SPEC_BATCH2.md §2 — side-by-side columns, attributes pulled
// directly from existing Product fields, "Add to Bag" per column.
export function CompareTable({ ids }: { ids: string[] }) {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all(
      ids.map((id) =>
        fetch(`/api/products/${id}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => data?.product ?? null),
      ),
    ).then((results) => setProducts(results.filter((p): p is Product => p !== null)));
  }, [ids]);

  async function handleAddToBag(productId: string) {
    await addItem({ productId, quantity: 1 });
    setAddedId(productId);
    setTimeout(() => setAddedId(null), 1500);
  }

  if (!products) {
    return <p className="py-16 text-center text-sm text-text-dark/40">Loading…</p>;
  }
  if (products.length === 0) {
    return <p className="py-16 text-center text-sm text-text-dark/40">Couldn&apos;t find those products.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse text-left text-sm">
        <thead>
          <tr>
            <th className="w-32"></th>
            {products.map((p) => (
              <th key={p.id} className="p-3 align-bottom">
                <div className="relative aspect-square w-full max-w-[140px] overflow-hidden rounded-card bg-ivory">
                  {p.images[0] && <Image src={p.images[0]} alt={p.name} fill className="object-cover" />}
                </div>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide">{p.name}</p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label} className="border-t border-black/10">
              <th className="p-3 text-xs font-medium uppercase tracking-wide text-text-dark/50">{row.label}</th>
              {products.map((p) => (
                <td key={p.id} className="max-w-[180px] p-3 text-text-dark/80">
                  {row.render(p)}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t border-black/10">
            <th className="p-3"></th>
            {products.map((p) => (
              <td key={p.id} className="p-3">
                <button
                  onClick={() => handleAddToBag(p.id)}
                  className="w-full rounded-full bg-olive-dark py-2 text-xs uppercase tracking-wide text-ivory"
                >
                  {addedId === p.id ? "✓ Added" : "Add to Bag"}
                </button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
