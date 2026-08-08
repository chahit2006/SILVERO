import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Now the real thing — join flow lives at the public /circle landing page
// (JoinCircleButton), and the Custom Order form is gated at
// /account/circle/custom-order via requireCircleMember(). This dashboard
// just reflects current status and links onward.
export default async function CirclePage() {
  const user = await requireUser();
  const membership = await db.circleMembership.findUnique({ where: { userId: user.id } });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">SILVERO Circle</h1>

      {membership ? (
        <div>
          <div className="rounded-card bg-olive-dark p-6 text-ivory">
            <p className="text-xs uppercase tracking-wide opacity-70">
              Member since {new Date(membership.joinedAt).toLocaleDateString("en-IN")}
            </p>
            <p className="mt-2 font-display text-2xl">{membership.pointsBalance} points</p>
            <p className="mt-1 text-sm opacity-80">Qualified via {membership.qualifiedVia.toLowerCase()}</p>
          </div>
          <Link
            href="/account/circle/custom-order"
            className="mt-4 inline-block rounded-full border border-olive-dark px-6 py-2.5 text-sm uppercase tracking-wide text-olive-dark"
          >
            Start a Custom Order
          </Link>
        </div>
      ) : (
        <div className="rounded-card border border-dashed border-black/15 p-10 text-center">
          <p className="text-sm text-text-dark/60">You&apos;re not a Circle member yet.</p>
          <Link href="/circle" className="mt-4 inline-block rounded-full bg-olive-dark px-6 py-2.5 text-sm uppercase tracking-wide text-ivory">
            Join Circle
          </Link>
        </div>
      )}
    </div>
  );
}
