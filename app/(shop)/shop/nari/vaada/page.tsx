import { ShopRoute } from "@/components/shop/ShopRoute";

export const dynamic = "force-dynamic";

export default function VaadaPage() {
  return <ShopRoute title="Vaada — Rings" baseFilters={{ category: ["vaada"] }} />;
}
