import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NewReturnForm } from "@/components/account/NewReturnForm";

export const dynamic = "force-dynamic";

export default async function NewReturnPage() {
  const user = await requireUser();
  const orders = await db.order.findMany({
    where: { userId: user.id, status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Start a Return</h1>

      {orders.length === 0 ? (
        <p className="rounded-card border border-dashed border-black/15 p-10 text-center text-sm text-text-dark/60">
          No orders eligible for return yet.{" "}
          <Link href="/shop" className="text-olive-dark underline">
            Start shopping
          </Link>
          .
        </p>
      ) : (
        <NewReturnForm orders={orders} />
      )}
    </div>
  );
}
