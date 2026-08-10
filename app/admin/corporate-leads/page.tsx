import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// ADMIN_PANEL_SPEC.md §5 — read-only, filterable by type. The list page
// queries Prisma directly (same convention as everywhere else); the GET
// route at /api/admin/corporate-leads exists for the documented API surface.
export default async function AdminCorporateLeadsPage({ searchParams }: { searchParams: { type?: string } }) {
  const leads = await db.corporateLead.findMany({
    where: searchParams.type === "CORPORATE" || searchParams.type === "BULK" ? { type: searchParams.type } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="mb-6 font-display text-xl">Corporate & Bulk Leads</h2>

      <div className="mb-4 flex gap-2 text-xs">
        <Link href="/admin/corporate-leads" className={`rounded-full border px-3 py-1 ${!searchParams.type ? "border-olive-dark text-olive-dark" : "border-black/15"}`}>
          All
        </Link>
        <Link href="/admin/corporate-leads?type=CORPORATE" className={`rounded-full border px-3 py-1 ${searchParams.type === "CORPORATE" ? "border-olive-dark text-olive-dark" : "border-black/15"}`}>
          Corporate
        </Link>
        <Link href="/admin/corporate-leads?type=BULK" className={`rounded-full border px-3 py-1 ${searchParams.type === "BULK" ? "border-olive-dark text-olive-dark" : "border-black/15"}`}>
          Bulk
        </Link>
      </div>

      {leads.length === 0 ? (
        <p className="py-16 text-center text-sm text-text-dark/40">No leads yet.</p>
      ) : (
        <ul className="divide-y divide-black/5 rounded-card border border-black/10">
          {leads.map((lead) => (
            <li key={lead.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
              <div>
                <p className="font-medium">{lead.company || lead.contact}</p>
                <p className="text-xs text-text-dark/50">
                  {lead.contact} · {lead.occasion ?? "—"} · Qty {lead.quantity ?? "—"} · {lead.budget ?? "—"} · {lead.timeline ?? "—"}
                </p>
              </div>
              <span className="rounded-full bg-ivory px-3 py-1 text-xs uppercase tracking-wide">{lead.type}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
