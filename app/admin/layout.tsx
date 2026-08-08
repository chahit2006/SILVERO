import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

// One gate covering every /admin/* page (ADMIN_PANEL_SPEC.md §1). Each
// /api/admin/* route still re-checks independently via getAdminOrNull() —
// this layout protects what gets *rendered*, never what gets *served*.
//
// Note: Next.js layouts do not re-run on client-side navigations between
// routes that share them, which is exactly why the per-route API check is not
// optional.
export const metadata: Metadata = {
  title: "Admin — SILVERO.925",
  // Internal tool: keep it out of search results even if a URL leaks.
  robots: { index: false, follow: false },
};

// Admin screens read live operational data — an order that is stale by a
// build is worse than useless to someone packing parcels.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-10 lg:px-8">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-2xl">SILVERO Admin</h1>
        <p className="text-xs uppercase tracking-wide text-text-dark/50">
          Signed in as {admin.email}
        </p>
      </div>

      <AdminNav />

      <div className="pt-6">{children}</div>
    </div>
  );
}
