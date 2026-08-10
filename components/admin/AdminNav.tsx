"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Only the pages that exist are listed — add each one here as it lands.
const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/circle-orders", label: "Circle Orders" },
  { href: "/admin/corporate-leads", label: "Corporate/Bulk" },
  { href: "/admin/engraving-requests", label: "Engraving" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-black/10">
      <ul className="flex gap-1 overflow-x-auto">
        {LINKS.map((link) => {
          // startsWith, not ===, so /admin/orders/[id] keeps its tab lit —
          // except for "/admin" itself, which would otherwise match every
          // other tab's pathname too (they all start with "/admin/").
          const active =
            link.href === "/admin" ? pathname === "/admin" : pathname === link.href || pathname.startsWith(`${link.href}/`);
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
