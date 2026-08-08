import { ShopRoute } from "@/components/shop/ShopRoute";

export const dynamic = "force-dynamic";

export default function SankalpPage() {
  return <ShopRoute title="Sankalp — Kada" baseFilters={{ category: ["sankalp"] }} />;
}
