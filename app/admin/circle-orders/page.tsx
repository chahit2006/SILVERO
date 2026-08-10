import { db } from "@/lib/db";
import { CircleOrderRow } from "@/components/admin/CircleOrderRow";

export const dynamic = "force-dynamic";

// ADMIN_PANEL_SPEC.md §5 — /admin/circle-orders, data source CustomOrder.
export default async function AdminCircleOrdersPage() {
  const submissions = await db.customOrder.findMany({
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="mb-6 font-display text-xl">Circle Custom Orders</h2>
      {submissions.length === 0 ? (
        <p className="py-16 text-center text-sm text-text-dark/40">No submissions yet.</p>
      ) : (
        <ul className="rounded-card border border-black/10">
          {submissions.map((s) => (
            <CircleOrderRow key={s.id} submission={s} />
          ))}
        </ul>
      )}
    </div>
  );
}
