import { ShopRoute } from "@/components/shop/ShopRoute";
import { narCategories } from "@/lib/nav-data";

export const dynamic = "force-dynamic";

export default function NarHubPage() {
  return (
    <ShopRoute
      title="Nar — Men's Silver Jewellery"
      description="Chains, rings, bracelets, and kada in 925 sterling silver."
      baseFilters={{ gender: "NAR" }}
      categories={narCategories}
    />
  );
}
