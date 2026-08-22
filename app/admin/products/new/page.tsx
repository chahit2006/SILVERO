import { db } from "@/lib/db";
import { getProductAttributeOptions } from "@/lib/attributes";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, attributeOptions] = await Promise.all([
    db.category.findMany({ orderBy: { englishName: "asc" } }),
    getProductAttributeOptions(),
  ]);

  return (
    <div>
      <h2 className="mb-6 font-display text-xl">Add Product</h2>
      <ProductForm categories={categories} attributeOptions={attributeOptions} />
    </div>
  );
}
