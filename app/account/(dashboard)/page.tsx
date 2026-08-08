import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AccountDashboardPage() {
  const user = await requireUser();

  const [orderCount, wishlistCount, circle] = await Promise.all([
    db.order.count({ where: { userId: user.id } }),
    db.wishlistItem.count({ where: { userId: user.id } }),
    db.circleMembership.findUnique({ where: { userId: user.id } }),
  ]);

  const stats = [
    { label: "Orders", value: orderCount, href: "/account/orders" },
    { label: "Wishlist", value: wishlistCount, href: "/account/wishlist" },
    { label: "Loyalty Points", value: circle?.pointsBalance ?? 0, href: "/account/loyalty" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl">Welcome back, {user.name?.split(" ")[0] ?? "there"}</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-card border border-black/10 p-5 transition-colors duration-150 hover:border-olive-dark"
          >
            <p className="text-2xl font-display">{stat.value}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-text-dark/50">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-card bg-ivory p-5">
        <p className="text-sm">
          {circle
            ? "You're a SILVERO Circle member."
            : "Not a Circle member yet — join for early access and rewards."}
        </p>
        <Link href="/account/circle" className="mt-2 inline-block text-xs uppercase tracking-wide text-olive-dark underline">
          View Circle status
        </Link>
      </div>
    </div>
  );
}
