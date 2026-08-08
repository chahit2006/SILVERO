import Link from "next/link";

const LINKS = [
  { href: "/about/story", label: "Our Story", desc: "How SILVERO.925 started." },
  { href: "/about/craft", label: "The Craft", desc: "How each piece is made." },
  { href: "/about/sustainability", label: "Sustainability", desc: "Our approach to responsible sourcing." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 lg:px-8">
      <h1 className="font-display text-3xl">About SILVERO.925</h1>
      <p className="mt-4 text-sm leading-relaxed text-text-dark/70">
        SILVERO.925 makes 925 sterling silver jewellery for everyday wear — handcrafted, hallmarked,
        and built to be worn daily, not just for the occasion.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="rounded-card border border-black/10 p-5 hover:border-olive-dark">
            <p className="font-display">{link.label}</p>
            <p className="mt-1 text-xs text-text-dark/50">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
