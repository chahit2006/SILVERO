import { ShopRoute } from "@/components/shop/ShopRoute";

export const dynamic = "force-dynamic";

export default function ValayaPage() {
  return <ShopRoute title="Valaya — Kada" baseFilters={{ category: ["valaya"] }} />;
}
