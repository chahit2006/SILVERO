import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { PendingPoller } from "@/components/checkout/PendingPoller";

export const dynamic = "force-dynamic";

// New route, not in DIRECTORY_STRUCTURE.md — needed as the Cashfree
// return_url target for gift card purchases, same reasoning as
// /order/[id]/confirmation (which the doc does list). Same "never trust the
// redirect as proof of payment" rule applies — only isPaid, as the webhook
// last set it, is shown.
export default async function GiftCardConfirmationPage({ params }: { params: { id: string } }) {
  const giftCard = await db.giftCard.findUnique({ where: { id: params.id } });
  if (!giftCard) notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center lg:px-8">
      <PendingPoller isPending={!giftCard.isPaid} />

      {giftCard.isPaid ? (
        <>
          <h1 className="font-display text-3xl">Gift card confirmed</h1>
          <div className="mt-8 rounded-card bg-ivory p-8">
            <p className="text-xs uppercase tracking-wide text-text-dark/50">Gift Card Code</p>
            <p className="mt-2 font-display text-2xl tracking-wide">{giftCard.code}</p>
            <p className="mt-2 text-sm text-text-dark/60">{formatPrice(giftCard.balance)} balance</p>
          </div>
          <p className="mt-4 text-xs text-text-dark/40">
            {giftCard.isDigital
              ? "Email delivery isn't wired up yet — save this code."
              : "Your physical card will be shipped to the address provided."}
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl">Confirming your payment…</h1>
          <p className="mt-2 text-sm text-text-dark/60">This page will update automatically.</p>
        </>
      )}
    </div>
  );
}
