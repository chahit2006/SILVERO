import { ShopRoute } from "@/components/shop/ShopRoute";
import { narCategories, nariCategories } from "@/lib/nav-data";

export const dynamic = "force-dynamic";

export default function ShopAllPage() {
  return (
    <ShopRoute
      title="Shop All"
      description="Every piece, handcrafted in 925 sterling silver."
      baseFilters={{}}
      categories={[...narCategories, ...nariCategories]}
    />
  );
}
