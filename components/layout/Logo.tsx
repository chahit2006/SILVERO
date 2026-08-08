import Link from "next/link";

// DESIGN_SYSTEM.md §4 — "SILVERO.925", Playfair Display, olive accent on ".925"
// `inverted` is for placement on the dark olive mobile nav panel — the doc
// doesn't specify an on-dark accent color, so it falls back to plain ivory
// there rather than guessing a second brand tint.
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link
      href="/"
      className={`font-display text-xl sm:text-2xl tracking-wide ${
        inverted ? "text-ivory" : "text-text-dark"
      }`}
      aria-label="SILVERO.925 home"
    >
      SILVERO
      <span className={inverted ? "text-ivory/70" : "text-olive-dark"}>.925</span>
    </Link>
  );
}
