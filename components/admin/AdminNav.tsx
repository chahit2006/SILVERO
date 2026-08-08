"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Only the pages that exist are listed. ADMIN_PANEL_SPEC.md §6 also specifies
// /admin (dashboard), /admin/products, /admin/circle-orders,
// /admin/corporate-leads, /admin/engraving-requests and /admin/returns — they
// are deliberately absent from this nav until they are built, rather than
// linked and dead. Add each one here as it lands.
const LINKS = [{ href: "/admin/orders", label: "Orders" }];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-black/10">
      <ul className="flex gap-1 overflow-x-auto">
        {LINKS.map((link) => {
          // startsWith, not ===, so /admin/orders/[id] keeps its tab lit.
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                className={`block whitespace-nowrap px-4 py-3 text-sm transition-colors duration-150 ${
                  active
                    ? "border-b-2 border-olive-dark font-medium text-olive-dark"
                    : "text-text-dark/60 hover:text-text-dark"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
