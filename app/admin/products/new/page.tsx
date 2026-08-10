import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await db.category.findMany({ orderBy: { englishName: "asc" } });

  return (
    <div>
      <h2 className="mb-6 font-display text-xl">Add Product</h2>
      <ProductForm categories={categories} />
    </div>
  );
}
