// DESIGN_SYSTEM.md §5 #8 — centered text, ivory background, max 640px, Playfair italic.
export function BrandStoryBlock() {
  return (
    <section className="bg-ivory py-20">
      <div className="mx-auto max-w-[640px] px-4 text-center">
        <p className="font-display text-2xl italic leading-relaxed text-text-dark sm:text-3xl">
          &ldquo;Every piece starts as raw 925 sterling silver, shaped by hand for people who wear
          their jewellery every day — not just for the occasion.&rdquo;
        </p>
      </div>
    </section>
  );
}
