import { ShopRoute } from "@/components/shop/ShopRoute";
import { narCategories, nariCategories } from "@/lib/nav-data";

export const dynamic = "force-dynamic";

// Simplification: rather than a separate tile-browsing UI, this reuses the
// same PLP with its Occasion filter open — see DIRECTORY_STRUCTURE.md's "one
// component" principle. Revisit if the client wants a dedicated tile layout.
export default function ShopByOccasionPage() {
  return (
    <ShopRoute
      title="Shop by Occasion"
      description="Find the right piece for everyday wear, festive occasions, weddings, and gifting — use the Occasion filter to narrow down."
      baseFilters={{}}
      categories={[...narCategories, ...nariCategories]}
    />
  );
}
