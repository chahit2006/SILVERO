import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AccountSidebar } from "@/components/account/AccountSidebar";

// Route group — doesn't add a URL segment, so /account/(dashboard)/orders
// still resolves to /account/orders. Separated from login/register/
// forgot-password (siblings under app/account/) specifically so this gate
// doesn't apply to the pages that must stay reachable while logged out.
export default async function AccountDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  // Only used to decide whether AccountSidebar shows an "Admin Panel" link —
  // a pure navigation hint. requireAdmin() re-checks role itself on every
  // /admin/* request regardless of what this renders, so a stale/spoofed
  // value here can't grant access, only mis-hide or mis-show a link.
  const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-10 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <AccountSidebar isAdmin={dbUser?.role === "ADMIN"} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
