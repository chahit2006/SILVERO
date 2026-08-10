"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "./Logo";

const SHOP_LINKS = [
  { href: "/shop/nar", label: "Nar" },
  { href: "/shop/nari", label: "Nari" },
  { href: "/shop/new", label: "New Arrivals" },
  { href: "/shop/bestsellers", label: "Bestsellers" },
  { href: "/gifting/gift-cards", label: "Gift Cards" },
];

const HELP_LINKS = [
  { href: "/faq", label: "FAQs" },
  { href: "/account/orders", label: "Order Tracking" },
  { href: "/shipping", label: "Shipping" },
  { href: "/guides/ring-size", label: "Size Guides" },
  { href: "/contact", label: "Contact" },
];

const ABOUT_LINKS = [
  { href: "/about/story", label: "Our Story" },
  { href: "/guides/silver", label: "Silver Guide" },
  { href: "/guides/hallmark", label: "Hallmark Guide" },
  { href: "/guides/care", label: "Jewellery Care" },
  { href: "/about/sustainability", label: "Sustainability" },
];

// DESIGN_SYSTEM.md §4 "Footer". Payment badges use Cashfree, not Razorpay —
// the IA doc's original copy said Razorpay, corrected per DESIGN_SYSTEM.md §10.3.
export function Footer() {
  return (
    <footer className="bg-charcoal text-ivory">
      <div className="mx-auto max-w-screen-2xl px-4 lg:px-8 py-14">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <Logo inverted />
            <p className="max-w-xs text-sm text-ivory/60">
              Handcrafted 925 sterling silver jewellery, made for everyday wear.
            </p>
            <NewsletterForm />
          </div>

          <FooterColumn title="Shop" links={SHOP_LINKS} />
          <FooterColumn title="Help" links={HELP_LINKS} />
          <FooterColumn title="About" links={ABOUT_LINKS} />
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="mx-auto flex max-w-screen-2xl flex-col-reverse items-center gap-4 px-4 lg:px-8 py-6 text-xs text-ivory/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} SILVERO.925. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-ivory">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ivory">
              Terms
            </Link>
          </div>

          <p className="tracking-wide">UPI · Cards · Net Banking · Wallets — Secured by Cashfree</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="mb-4 text-xs uppercase tracking-wide text-ivory/50">{title}</p>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-ivory/80 hover:text-ivory">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// No newsletter API route exists yet (not in API_SPEC.md) — this is a UI
// stub; wire it to a real endpoint when the newsletter feature is built.
function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "submitted">("idle");

  return (
    <form
      className="pt-2"
      onSubmit={(e) => {
        e.preventDefault();
        setStatus("submitted");
      }}
    >
      <p className="mb-2 text-xs uppercase tracking-wide text-ivory/50">Stay in the know</p>
      {status === "submitted" ? (
        <p className="text-sm text-ivory/80">Thanks — you&apos;re on the list.</p>
      ) : (
        <div className="flex max-w-xs overflow-hidden rounded-card border border-ivory/20">
          <input
            type="email"
            required
            placeholder="Email address"
            className="w-full bg-transparent px-3 py-2 text-sm text-ivory placeholder:text-ivory/40 outline-none"
          />
          <button
            type="submit"
            className="shrink-0 bg-ivory px-4 text-xs uppercase tracking-wide text-charcoal transition-colors duration-150 hover:bg-ivory/90"
          >
            Submit
          </button>
        </div>
      )}
    </form>
  );
}
