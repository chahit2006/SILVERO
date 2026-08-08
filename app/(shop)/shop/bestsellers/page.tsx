import { ShopRoute } from "@/components/shop/ShopRoute";
import { narCategories, nariCategories } from "@/lib/nav-data";

export const dynamic = "force-dynamic";

export default function BestsellersPage() {
  return (
    <ShopRoute
      title="Bestsellers"
      description="The pieces our customers keep coming back for."
      baseFilters={{ isBestseller: true }}
      categories={[...narCategories, ...nariCategories]}
    />
  );
}
