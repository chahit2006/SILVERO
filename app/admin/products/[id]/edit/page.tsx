import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id: params.id }, include: { sizeStocks: true } }),
    db.category.findMany({ orderBy: { englishName: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <h2 className="mb-6 font-display text-xl">Edit {product.name}</h2>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
