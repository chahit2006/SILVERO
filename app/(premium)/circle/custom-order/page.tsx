import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getCircleMembership } from "@/lib/circle";

export const dynamic = "force-dynamic";

// Public entry point (DIRECTORY_STRUCTURE.md's (premium)/circle/custom-order)
// — "redirects logged-in Circle members to /account/circle/custom-order,
// prompts non-members/guests to join." The actual gated form lives at
// /account/circle/custom-order.
export default async function CustomOrderEntryPage() {
  const user = await getSessionUser();
  const membership = user ? await getCircleMembership(user.id) : null;

  if (membership) {
    redirect("/account/circle/custom-order");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center lg:px-8">
      <h1 className="font-display text-3xl">One-of-One Custom Orders</h1>
      <p className="mt-4 text-sm text-text-dark/60">
        Custom orders are a SILVERO Circle member benefit — {user ? "join Circle to submit one." : "sign in and join Circle to submit one."}
      </p>
      <Link
        href="/circle"
        className="mt-8 inline-block rounded-full bg-olive-dark px-8 py-3 text-sm uppercase tracking-wide text-ivory"
      >
        {user ? "Join Circle" : "Sign In"}
      </Link>
    </div>
  );
}
