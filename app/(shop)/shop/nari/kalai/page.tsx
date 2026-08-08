import { ShopRoute } from "@/components/shop/ShopRoute";

export const dynamic = "force-dynamic";

export default function KalaiPage() {
  return <ShopRoute title="Kalai — Bracelets" baseFilters={{ category: ["kalai"] }} />;
}
