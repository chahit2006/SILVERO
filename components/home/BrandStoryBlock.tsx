import Image from "next/image";

// DESIGN_SYSTEM.md §5 #8 — centered text, ivory background, max 640px, Playfair italic.
// Hero image added as a full-bleed background behind the quote, per client
// request — kept subtle (opacity + ivory overlay) so the text stays legible
// and the section's original spec (centered text, ivory bg) still holds.
export function BrandStoryBlock() {
  return (
    <section className="relative overflow-hidden bg-ivory py-20">
      <Image
        src="/placeholders/brand-story-hero.png"
        alt=""
        fill
        className="object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-ivory/45" />
      <div className="relative mx-auto max-w-[640px] px-4 text-center">
        {/* Local backdrop behind the quote — keeps text-dark/ivory contrast at
            its original AA-safe level no matter what's in the photo behind it. */}
        <p className="rounded-card bg-ivory/80 px-6 py-8 font-display text-2xl italic leading-relaxed text-text-dark sm:text-3xl">
          &ldquo;Every piece starts as raw 925 sterling silver, shaped by hand for people who wear
          their jewellery every day — not just for the occasion.&rdquo;
        </p>
      </div>
    </section>
  );
}
