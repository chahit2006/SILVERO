import Link from "next/link";

const LINKS = [
  { href: "/gifting/gift-cards", label: "Gift Cards", desc: "Digital or physical, any amount." },
  { href: "/gifting/build-your-gift", label: "Build a Gift", desc: "Bundle a few pieces together." },
  { href: "/gifting/registry", label: "Registry", desc: "Create or shop a registry." },
  { href: "/gifting/wrapping", label: "Gift Wrapping", desc: "Signature and premium options." },
  { href: "/gifting/guides", label: "Gifting Guides", desc: "For her, for him, by occasion, by budget." },
];

export default function GiftingHubPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
      <h1 className="font-display text-3xl">Gifting</h1>
      <p className="mt-3 text-sm text-text-dark/60">Everything for giving (and being given) silver.</p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
