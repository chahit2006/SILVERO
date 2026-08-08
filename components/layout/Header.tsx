"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { AnnouncementBar } from "./AnnouncementBar";
import { Logo } from "./Logo";
import { MegaMenu } from "./MegaMenu";
import { MobileNav } from "./MobileNav";
import { SearchOverlay } from "./SearchOverlay";
import { useCart } from "@/components/providers/CartProvider";
import { useWishlist } from "@/components/providers/WishlistProvider";
import {
  BagIcon,
  ChevronDownIcon,
  HeartIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "@/components/ui/icons";

const NAV_LINKS = [
  { href: "/shop/nar", label: "Nar" },
  { href: "/shop/nari", label: "Nari" },
  { href: "/gifting", label: "Gifting" },
  { href: "/guides/silver", label: "Silver Guide" },
  { href: "/about", label: "About Us" },
];

// DESIGN_SYSTEM.md §4 "Header / Navigation".
export function Header() {
  const { status } = useSession();
  const { count: cartCount, open: openCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    function onScroll() {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      // Ignore tiny jitters and never hide while still near the top.
      if (Math.abs(delta) > 8) {
        setHidden(currentY > 80 && delta > 0);
        lastScrollY.current = currentY;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white transition-transform duration-300 ease-in-out ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <AnnouncementBar />

      <div className="mx-auto flex h-header-mobile lg:h-header-desktop max-w-screen-2xl items-center justify-between px-4 lg:px-8">
        {/* Mobile: hamburger left */}
        <button
          className="p-2 -ml-2 lg:hidden"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <MenuIcon />
        </button>

        {/* Desktop: logo left-aligned. Mobile: logo centered. */}
        <div className="lg:flex-none flex-1 flex justify-center lg:justify-start">
          <Logo />
        </div>

        {/* Desktop primary nav */}
        <nav className="hidden lg:flex items-center gap-8">
          <div
            className="relative"
            onMouseEnter={() => setMegaOpen(true)}
            onMouseLeave={() => setMegaOpen(false)}
          >
            <button className="flex items-center gap-1 text-sm uppercase tracking-wide link-underline">
              Jewellery
              <ChevronDownIcon width={14} height={14} />
            </button>
            {megaOpen && <MegaMenu />}
          </div>

          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm uppercase tracking-wide link-underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right cluster: search | account | wishlist | bag */}
        <div className="flex items-center gap-4 lg:gap-5">
          <button aria-label="Search" onClick={() => setSearchOpen(true)} className="p-1">
            <SearchIcon />
          </button>
          <Link
            href={status === "authenticated" ? "/account" : "/account/login"}
            aria-label="Account"
            className="p-1 hidden sm:inline-flex"
          >
            <UserIcon />
          </Link>
          <Link href="/account/wishlist" aria-label="Wishlist" className="relative p-1 hidden sm:inline-flex">
            <HeartIcon />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-olive-dark text-[10px] text-ivory">
                {wishlistCount}
              </span>
            )}
          </Link>
          <button aria-label="Bag" onClick={openCart} className="relative p-1">
            <BagIcon />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-olive-dark text-[10px] text-ivory">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
