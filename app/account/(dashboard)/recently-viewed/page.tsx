import { requireUser } from "@/lib/auth";
import { getCartOwner, cartWhere } from "@/lib/cart";
import { db } from "@/lib/db";
import { RecentlyViewedGrid } from "@/components/account/RecentlyViewedGrid";

export const dynamic = "force-dynamic";

export default async function RecentlyViewedPage() {
  await requireUser(); // guarantees getCartOwner() below never hits the guest-cookie branch here

  const owner = await getCartOwner();
  const views = await db.recentlyViewed.findMany({
    where: cartWhere(owner),
    include: { product: true },
    orderBy: { viewedAt: "desc" },
    take: 20,
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Recently Viewed</h1>
      <RecentlyViewedGrid products={views.map((v) => v.product)} />
    </div>
  );
}
