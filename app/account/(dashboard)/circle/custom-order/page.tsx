import { requireCircleMember } from "@/lib/circle";
import { db } from "@/lib/db";
import { CustomOrderForm } from "@/components/circle/CustomOrderForm";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  QUOTATION_SENT: "Quotation Sent",
  APPROVED: "Approved",
  IN_PRODUCTION: "In Production",
  QUALITY_CHECK: "Quality Check",
  READY: "Ready",
  SHIPPED: "Shipped",
};

// Gated per ARCHITECTURE.md "Membership Gating" — requireCircleMember()
// redirects non-members to /circle before this ever renders. The API route
// (app/api/circle/custom-order) re-checks independently.
export default async function CustomOrderPage() {
  const { user } = await requireCircleMember();
  const submissions = await db.customOrder.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl">Custom Order</h1>
      <p className="mb-6 text-sm text-text-dark/60">
        One-of-one pieces, made to your spec. Submit reference photos and details below.
      </p>

      {submissions.length > 0 && (
        <div className="mb-8">
          <p className="mb-3 text-xs uppercase tracking-wide text-text-dark/50">Your submissions</p>
          <ul className="divide-y divide-black/10 rounded-card border border-black/10">
            {submissions.map((s) => (
              <li key={s.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <p className="font-medium">{s.referenceNumber}</p>
                  <p className="text-xs text-text-dark/50">
                    {s.jewelleryType} · {new Date(s.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <span className="rounded-full bg-ivory px-3 py-1 text-xs uppercase tracking-wide">
                  {STATUS_LABEL[s.status] ?? s.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <CustomOrderForm />
    </div>
  );
}
