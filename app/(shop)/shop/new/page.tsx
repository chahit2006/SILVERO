import { ShopRoute } from "@/components/shop/ShopRoute";
import { narCategories, nariCategories } from "@/lib/nav-data";

export const dynamic = "force-dynamic";

export default function NewArrivalsPage() {
  return (
    <ShopRoute
      title="New Arrivals"
      description="The latest additions to the collection."
      baseFilters={{ isNew: true }}
      categories={[...narCategories, ...nariCategories]}
    />
  );
}
