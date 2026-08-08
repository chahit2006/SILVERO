import { ShopRoute } from "@/components/shop/ShopRoute";

export const dynamic = "force-dynamic";

export default function NishaanPage() {
  return <ShopRoute title="Nishaan — Rings" baseFilters={{ category: ["nishaan"] }} />;
}
