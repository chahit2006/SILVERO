import { requireUser } from "@/lib/auth";
import { AccountSidebar } from "@/components/account/AccountSidebar";

// Route group — doesn't add a URL segment, so /account/(dashboard)/orders
// still resolves to /account/orders. Separated from login/register/
// forgot-password (siblings under app/account/) specifically so this gate
// doesn't apply to the pages that must stay reachable while logged out.
export default async function AccountDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-10 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <AccountSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
