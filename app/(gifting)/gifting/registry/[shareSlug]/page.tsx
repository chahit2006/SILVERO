import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { RegistryPurchaseButton } from "@/components/gifting/RegistryPurchaseButton";

export const dynamic = "force-dynamic";

// New route, not in DIRECTORY_STRUCTURE.md — the public guest-facing view
// implied by API_SPEC.md's /api/registry/[shareSlug] but with no page ever
// specified to render it (the doc only lists gifting/registry/page.tsx,
// which is the owner's create/manage view). Necessary addition, flagged
// same as other structural gaps.
export default async function PublicRegistryPage({ params }: { params: { shareSlug: string } }) {
  const registry = await db.registry.findUnique({
    where: { shareSlug: params.shareSlug },
    include: { user: { select: { firstName: true, lastName: true } }, items: { include: { product: true } } },
  });
  if (!registry) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
      <p className="text-xs uppercase tracking-wide text-olive-dark">{registry.occasion}</p>
      <h1 className="mt-2 font-display text-3xl">
        {registry.user.firstName}
        {registry.user.lastName ? ` ${registry.user.lastName}` : ""}&apos;s Registry
      </h1>
      <p className="mt-1 text-sm text-text-dark/60">{registry.name}</p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {registry.items.map((item) => (
          <div key={item.id} className="flex gap-3 rounded-card border border-black/10 p-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-card bg-ivory">
              {item.product.images[0] && <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />}
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <p className="text-sm font-medium">{item.product.name}</p>
                <p className="text-xs text-text-dark/50">{formatPrice(item.product.price)}</p>
              </div>
              {item.purchased ? (
                <p className="text-xs uppercase tracking-wide text-olive-dark">
                  Purchased{item.purchasedByGuestName ? ` by ${item.purchasedByGuestName}` : ""}
                </p>
              ) : (
                <RegistryPurchaseButton shareSlug={params.shareSlug} productId={item.productId} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
