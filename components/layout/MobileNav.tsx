"use client";

import Link from "next/link";
import { useEffect } from "react";
import { narCategories, nariCategories } from "@/lib/nav-data";
import { Logo } from "./Logo";
import { XIcon } from "@/components/ui/icons";

const PRIMARY_LINKS = [
  { href: "/shop/nar", label: "Nar" },
  { href: "/shop/nari", label: "Nari" },
  { href: "/gifting", label: "Gifting" },
  { href: "/guides/silver", label: "Silver Guide" },
  { href: "/about", label: "About Us" },
];

// DESIGN_SYSTEM.md §4 — mobile hamburger opens a full-screen slide panel
// from the left, dark olive background (sampled).
export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button
        aria-label="Close menu"
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
      />
      <div className="relative z-10 h-full w-[85vw] max-w-sm animate-slide-in-left overflow-y-auto bg-olive-dark text-ivory">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ivory/15">
          <Logo inverted />
          <button aria-label="Close menu" onClick={onClose} className="p-2 -mr-2">
            <XIcon />
          </button>
        </div>

        <nav className="px-5 py-6 space-y-6">
          <ul className="space-y-4">
            {PRIMARY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="font-display text-lg uppercase tracking-wide"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div>
            <p className="text-xs uppercase tracking-wide text-ivory/50 mb-3">Nar</p>
            <ul className="space-y-2 mb-6">
              {narCategories.map((cat) => (
                <li key={cat.slug}>
                  <Link href={cat.href} onClick={onClose} className="text-sm text-ivory/85">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="text-xs uppercase tracking-wide text-ivory/50 mb-3">Nari</p>
            <ul className="space-y-2">
              {nariCategories.map((cat) => (
                <li key={cat.slug}>
                  <Link href={cat.href} onClick={onClose} className="text-sm text-ivory/85">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
}
