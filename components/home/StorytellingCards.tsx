import Image from "next/image";
import Link from "next/link";

const CARDS = [
  { title: "The Craft", href: "/about/craft", image: "/placeholders/lifestyle-a.svg" },
  { title: "Our Story", href: "/about/story", image: "/placeholders/lifestyle-b.svg" },
  { title: "Sustainability", href: "/about/sustainability", image: "/placeholders/lifestyle-c.svg" },
];

// DESIGN_SYSTEM.md §5 #5 — 3 editorial cards, 3:4, dark scrim + white text, hover lift.
export function StorytellingCards() {
  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-16 lg:px-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group relative aspect-[3/4] overflow-hidden rounded-card transition-transform duration-300 hover:-translate-y-1"
          >
            <Image src={card.image} alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <p className="absolute bottom-5 left-5 font-display text-xl text-ivory">{card.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
