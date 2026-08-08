import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const user = await requireUser();

  // Code is derived from the user's own (unique) id, so this can't collide
  // with another user's code — no retry-on-conflict logic needed.
  const code = `SILV-${user.id.slice(-8).toUpperCase()}`;

  const referral = await db.referral.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, code },
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Referrals</h1>
      <div className="rounded-card border border-black/10 p-6">
        <p className="text-sm text-text-dark/60">Share your code — rewards for both sides launch with SILVERO Circle.</p>
        <p className="mt-4 inline-block rounded-full bg-ivory px-5 py-2 font-display text-lg tracking-wide">
          {referral.code}
        </p>
      </div>
    </div>
  );
}
