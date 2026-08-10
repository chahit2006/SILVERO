import { AdminDashboard } from "@/components/admin/AdminDashboard";

// requireAdmin() already ran in app/admin/layout.tsx — this page just renders.
export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
