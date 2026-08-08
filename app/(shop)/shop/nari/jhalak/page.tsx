import { ShopRoute } from "@/components/shop/ShopRoute";

export const dynamic = "force-dynamic";

export default function JhalakPage() {
  return <ShopRoute title="Jhalak — Pendant Chains" baseFilters={{ category: ["jhalak"] }} />;
}
