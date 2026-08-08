import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getCircleMembership, qualifiesViaPastPurchase, CIRCLE_JOIN_FEE } from "@/lib/circle";
import { JoinCircleButton } from "@/components/circle/JoinCircleButton";

export const dynamic = "force-dynamic";

const BENEFITS = [
  "Early access to new drops",
  "A custom one-of-one order line, made to your spec",
  "Loyalty points on every purchase",
  "Free lifetime re-plating on gold-plated pieces",
];

// Public marketing/join landing — DIRECTORY_STRUCTURE.md's (premium)/circle
// route group. Distinct from /account/circle, the logged-in member
// dashboard. Now genuinely built (not the earlier "skip, undocumented
// phase" call) since Circle membership itself is what's being built here.
export default async function CircleLandingPage() {
  const user = await getSessionUser();
  const membership = user ? await getCircleMembership(user.id) : null;
  const eligibleFree = user && !membership ? await qualifiesViaPastPurchase(user.id) : false;

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center lg:px-8">
      <p className="text-xs uppercase tracking-wide text-olive-dark">SILVERO Circle</p>
      <h1 className="mt-3 font-display text-4xl">Membership, made for people who wear silver daily</h1>
      <p className="mt-4 text-text-dark/60">
        A free perk if you&apos;ve shopped with us before, or a paid membership if you haven&apos;t yet.
      </p>

      <ul className="mx-auto mt-10 max-w-sm space-y-3 text-left text-sm">
        {BENEFITS.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-olive-dark" />
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-10">
        {membership ? (
          <div>
            <p className="mb-3 text-sm text-text-dark/60">You&apos;re already a Circle member.</p>
            <Link href="/account/circle" className="text-sm uppercase tracking-wide text-olive-dark underline">
              Go to your Circle dashboard
            </Link>
          </div>
        ) : (
          <>
            {user && eligibleFree && (
              <p className="mb-3 text-sm text-olive-dark">
                You qualify for free membership from a past purchase.
              </p>
            )}
            <JoinCircleButton circleJoinFee={CIRCLE_JOIN_FEE} />
          </>
        )}
      </div>
    </div>
  );
}
