import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AddressBook } from "@/components/account/AddressBook";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: { isDefault: "desc" } });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Addresses</h1>
      <AddressBook initialAddresses={addresses} />
    </div>
  );
}
