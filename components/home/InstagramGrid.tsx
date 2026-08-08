import Image from "next/image";

const TILES = ["a", "b", "c", "a", "b", "c"];

// DESIGN_SYSTEM.md §5 #12 — 4–6 square image grid, "#SILVERO925". No real
// Instagram API integration (would need a paid/rate-limited token) —
// placeholder tiles until real UGC/photography exists.
export function InstagramGrid() {
  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-16 lg:px-8">
      <p className="mb-6 text-center font-display text-xl">#SILVERO925</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {TILES.map((letter, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-card">
            <Image src={`/placeholders/lifestyle-${letter}.svg`} alt="" fill className="object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}
