import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { RegistryPageClient } from "@/components/gifting/RegistryPageClient";

export const dynamic = "force-dynamic";

export default async function RegistryPage() {
  const user = await getSessionUser();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 lg:px-8">
      <h1 className="mb-2 font-display text-3xl">Jewellery Registry</h1>
      <p className="mb-10 text-sm text-text-dark/60">
        Build a registry for your wedding or event — share the link, guests can buy items directly, no
        account required on their end.
      </p>

      {!user ? (
        <div className="rounded-card border border-dashed border-black/15 p-10 text-center">
          <p className="text-sm text-text-dark/60">Sign in to create a registry.</p>
          <Link href="/account/login?callbackUrl=/gifting/registry" className="mt-4 inline-block rounded-full bg-olive-dark px-6 py-2.5 text-sm uppercase tracking-wide text-ivory">
            Sign In
          </Link>
        </div>
      ) : (
        <RegistryPageClient existingRegistries={await db.registry.findMany({ where: { userId: user.id }, orderBy: { id: "desc" } })} />
      )}
    </div>
  );
}
