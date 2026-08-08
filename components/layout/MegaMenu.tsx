import Link from "next/link";
import { narCategories, nariCategories } from "@/lib/nav-data";

// DESIGN_SYSTEM.md §4 — JEWELLERY mega-menu, hover-triggered, shows Nar + Nari sub-categories.
export function MegaMenu() {
  return (
    <div
      className="absolute left-1/2 top-full z-40 w-[min(90vw,760px)] -translate-x-1/2 rounded-b-card border-t border-black/5 bg-white shadow-lg animate-fade-in"
      role="menu"
    >
      <div className="grid grid-cols-2 gap-8 p-8">
        <div>
          <Link
            href="/shop/nar"
            className="mb-4 block font-display text-sm uppercase tracking-wide text-text-dark link-underline"
          >
            Nar — Men
          </Link>
          <ul className="space-y-3">
            {narCategories.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={cat.href}
                  className="text-sm text-text-dark/80 hover:text-olive-dark transition-colors duration-150"
                >
                  {cat.name} <span className="text-text-dark/40">· {cat.englishName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Link
            href="/shop/nari"
            className="mb-4 block font-display text-sm uppercase tracking-wide text-text-dark link-underline"
          >
            Nari — Women
          </Link>
          <ul className="space-y-3">
            {nariCategories.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={cat.href}
                  className="text-sm text-text-dark/80 hover:text-olive-dark transition-colors duration-150"
                >
                  {cat.name} <span className="text-text-dark/40">· {cat.englishName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
