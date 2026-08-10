"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category, Product } from "@prisma/client";
import { formatPrice } from "@/lib/format";

type ProductWithCategory = Product & { category: Category };

export function ProductsTable({ products }: { products: ProductWithCategory[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleArchive(product: ProductWithCategory) {
    setBusyId(product.id);
    try {
      if (product.isArchived) {
        const formData = new FormData();
        formData.set("isArchived", "false");
        await fetch(`/api/admin/products/${product.id}`, { method: "PATCH", body: formData });
      } else {
        await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (products.length === 0) {
    return <p className="py-16 text-center text-sm text-text-dark/40">No products match these filters.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-card border border-black/10">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-black/10 bg-ivory text-xs uppercase tracking-wide text-text-dark/50">
          <tr>
            <th className="p-3">Product</th>
            <th className="p-3">Category</th>
            <th className="p-3">Price</th>
            <th className="p-3">Stock</th>
            <th className="p-3">Badges</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {products.map((p) => (
            <tr key={p.id} className={p.isArchived ? "opacity-50" : ""}>
              <td className="flex items-center gap-3 p-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-card bg-ivory">
                  {p.images[0] && <Image src={p.images[0]} alt="" fill className="object-cover" />}
                </div>
                {p.name}
              </td>
              <td className="p-3 text-text-dark/60">{p.category.name}</td>
              <td className="p-3">{formatPrice(p.price)}</td>
              <td className={`p-3 ${p.stock < 5 ? "font-medium text-red-700" : ""}`}>{p.stock}</td>
              <td className="p-3 text-xs">
                {p.isBestseller && <span className="mr-1 rounded-full bg-ivory px-2 py-0.5">Bestseller</span>}
                {p.isNew && <span className="rounded-full bg-ivory px-2 py-0.5">New</span>}
                {p.isArchived && <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">Archived</span>}
              </td>
              <td className="space-x-3 p-3 text-right">
                <Link href={`/admin/products/${p.id}/edit`} className="text-xs uppercase tracking-wide text-olive-dark underline">
                  Edit
                </Link>
                <button
                  onClick={() => toggleArchive(p)}
                  disabled={busyId === p.id}
                  className="text-xs uppercase tracking-wide text-text-dark/50 underline disabled:opacity-50"
                >
                  {p.isArchived ? "Unarchive" : "Archive"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
