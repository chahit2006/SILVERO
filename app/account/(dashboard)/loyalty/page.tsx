import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LoyaltyPage() {
  const user = await requireUser();
  const [membership, transactions] = await Promise.all([
    db.circleMembership.findUnique({ where: { userId: user.id } }),
    db.loyaltyTransaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Loyalty Points</h1>

      <p className="font-display text-3xl">{membership?.pointsBalance ?? 0} points</p>

      {!membership && (
        <p className="mt-2 text-sm text-text-dark/60">
          <Link href="/account/circle" className="text-olive-dark underline">
            Join SILVERO Circle
          </Link>{" "}
          to start earning points on every purchase.
        </p>
      )}

      {transactions.length > 0 && (
        <ul className="mt-6 divide-y divide-black/10 rounded-card border border-black/10">
          {transactions.map((t) => (
            <li key={t.id} className="flex items-center justify-between p-4 text-sm">
              <span>{t.type === "EARN" ? "Earned" : "Redeemed"}</span>
              <span>{new Date(t.createdAt).toLocaleDateString("en-IN")}</span>
              <span className={t.type === "EARN" ? "text-olive-dark" : "text-red-700"}>
                {t.type === "EARN" ? "+" : "-"}
                {t.points}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
