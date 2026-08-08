import { ShopRoute } from "@/components/shop/ShopRoute";

export const dynamic = "force-dynamic";

export default function NoorPage() {
  return <ShopRoute title="Noor — Pendant Sets" baseFilters={{ category: ["noor"] }} />;
}
