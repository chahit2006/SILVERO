import { ShopRoute } from "@/components/shop/ShopRoute";
import { narCategories, nariCategories } from "@/lib/nav-data";

export const dynamic = "force-dynamic";

// Same simplification as /shop/occasion — reuses the shared PLP with its
// Price Range filter, rather than a separate tile-browsing page.
export default function ShopByPricePage() {
  return (
    <ShopRoute
      title="Shop by Price"
      description="Browse by budget — use the Price Range filter to narrow down."
      baseFilters={{}}
      categories={[...narCategories, ...nariCategories]}
    />
  );
}
