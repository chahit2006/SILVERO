import { db } from "@/lib/db";
import { AdminStatusSelect } from "@/components/admin/AdminStatusSelect";

export const dynamic = "force-dynamic";

const STATUSES = ["REQUESTED", "CONFIRMED", "IN_PRODUCTION", "SHIPPED"] as const;

export default async function AdminEngravingRequestsPage() {
  const requests = await db.engravingRequest.findMany({
    include: { product: { select: { name: true } }, user: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="mb-6 font-display text-xl">Engraving Requests</h2>
      {requests.length === 0 ? (
        <p className="py-16 text-center text-sm text-text-dark/40">No requests yet.</p>
      ) : (
        <ul className="divide-y divide-black/5 rounded-card border border-black/10">
          {requests.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div>
                <p className="font-medium">{r.product.name}</p>
                <p className="text-xs text-text-dark/50">
                  &ldquo;{r.message}&rdquo; — {r.placement} · {r.user ? `${r.user.firstName} ${r.user.lastName}` : "Guest"} ·{" "}
                  via {r.contactPreference} · {new Date(r.createdAt).toLocaleDateString("en-IN")}
                </p>
              </div>
              <AdminStatusSelect endpoint={`/api/admin/engraving-requests/${r.id}`} currentStatus={r.status} options={STATUSES} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
