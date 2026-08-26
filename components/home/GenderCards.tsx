import Image from "next/image";
import Link from "next/link";

// DESIGN_SYSTEM.md §5 #3 — 2 large cards, aspect 3:4/4:5, hover scale 1.03/0.4s.
export function GenderCards() {
  const cards = [
    { href: "/shop/nar", label: "Nar", sub: "Men's Silver", image: "/placeholders/nar-category.png" },
    { href: "/shop/nari", label: "Nari", sub: "Women's Silver", image: "/placeholders/nari-category.png" },
  ];

  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-16 lg:px-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group relative aspect-[3/4] overflow-hidden rounded-card"
          >
            <Image
              src={card.image}
              alt={card.label}
              fill
              className="object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 text-ivory">
              <p className="font-display text-3xl">{card.label}</p>
              <p className="text-sm uppercase tracking-wide opacity-80">{card.sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
