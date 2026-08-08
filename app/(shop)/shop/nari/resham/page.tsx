import { ShopRoute } from "@/components/shop/ShopRoute";

export const dynamic = "force-dynamic";

export default function ReshamPage() {
  return <ShopRoute title="Resham — Chains" baseFilters={{ category: ["resham"] }} />;
}
