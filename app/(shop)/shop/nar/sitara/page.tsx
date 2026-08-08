import { ShopRoute } from "@/components/shop/ShopRoute";

export const dynamic = "force-dynamic";

export default function SitaraPage() {
  return <ShopRoute title="Sitara — Tennis Bracelets" baseFilters={{ category: ["sitara"] }} />;
}
