import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { WishlistGrid } from "@/components/account/WishlistGrid";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await requireUser();
  const items = await db.wishlistItem.findMany({ where: { userId: user.id }, include: { product: true } });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Wishlist</h1>
      <WishlistGrid initialProducts={items.map((i) => i.product)} />
    </div>
  );
}
