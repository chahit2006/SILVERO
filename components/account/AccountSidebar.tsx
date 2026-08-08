"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const LINKS = [
  { href: "/account", label: "Dashboard" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/invoices", label: "Invoices" },
  { href: "/account/returns", label: "Returns" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/recently-viewed", label: "Recently Viewed" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/payments", label: "Payment Methods" },
  { href: "/account/circle", label: "SILVERO Circle" },
  { href: "/account/referrals", label: "Referrals" },
  { href: "/account/loyalty", label: "Loyalty Points" },
  { href: "/account/preferences", label: "Preferences" },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-full shrink-0 lg:w-[220px]">
      <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
                  active ? "bg-olive-dark text-ivory" : "text-text-dark/70 hover:bg-ivory"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="block w-full whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm text-text-dark/50 hover:bg-ivory"
          >
            Sign Out
          </button>
        </li>
      </ul>
    </nav>
  );
}
