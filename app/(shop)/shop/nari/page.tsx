import { ShopRoute } from "@/components/shop/ShopRoute";
import { nariCategories } from "@/lib/nav-data";

export const dynamic = "force-dynamic";

export default function NariHubPage() {
  return (
    <ShopRoute
      title="Nari — Women's Silver Jewellery"
      description="Chains, rings, pendant sets, bracelets, and kada in 925 sterling silver."
      baseFilters={{ gender: "NARI" }}
      categories={nariCategories}
    />
  );
}
