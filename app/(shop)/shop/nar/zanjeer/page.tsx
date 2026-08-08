import { ShopRoute } from "@/components/shop/ShopRoute";

export const dynamic = "force-dynamic";

export default function ZanjeerPage() {
  return <ShopRoute title="Zanjeer — Chains" baseFilters={{ category: ["zanjeer"] }} />;
}
