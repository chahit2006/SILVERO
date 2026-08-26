"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// Reordered 2026-08-27 (IMAGES.md Pass 2, FIX 1) — the "New Season" slide
// has no real photo yet (still an SVG placeholder), so the two slides with
// real trial photos lead and it plays last instead of first/`priority`.
const SLIDES = [
  {
    image: "/placeholders/nar-hero.png",
    eyebrow: "Nar — Men",
    headline: "Chains and kada with real weight",
    cta: { label: "Shop Nar", href: "/shop/nar" },
  },
  {
    image: "/placeholders/nari-hero.png",
    eyebrow: "Nari — Women",
    headline: "Everyday silver, festive-ready",
    cta: { label: "Shop Nari", href: "/shop/nari" },
  },
  {
    image: "/placeholders/lifestyle-a.svg",
    eyebrow: "New Season",
    headline: "Silver, made for everyday wear",
    cta: { label: "Explore Collections", href: "/shop" },
  },
];

// DESIGN_SYSTEM.md §5 #1 — "the only auto-play carousel allowed on the
// site," 2–3 heroes, crossfade, 6s auto-advance, dot nav. Respects
// prefers-reduced-motion by disabling auto-advance (§9 rule).
export function Hero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative min-h-[75vh] w-full overflow-hidden bg-ivory">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.headline}
          className={`absolute inset-0 grid grid-cols-1 items-center transition-opacity duration-[800ms] ease-in-out md:grid-cols-2 ${
            i === active ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div className="order-2 px-6 py-12 md:order-1 md:px-16">
            <p className="text-xs uppercase tracking-[0.2em] text-olive-dark">{slide.eyebrow}</p>
            <h1 className="mt-4 max-w-md font-display text-4xl leading-tight text-text-dark sm:text-5xl">
              {slide.headline}
            </h1>
            <Link
              href={slide.cta.href}
              className="mt-8 inline-block rounded-full border border-text-dark px-7 py-3 text-sm uppercase tracking-wide text-text-dark transition-colors duration-150 hover:bg-text-dark hover:text-ivory"
            >
              {slide.cta.label}
            </Link>
          </div>
          <div className="relative order-1 min-h-[40vh] md:order-2 md:min-h-[75vh]">
            <Image src={slide.image} alt="" fill className="object-cover" priority={i === 0} />
          </div>
        </div>
      ))}

      {/* Spacer so the section has real height under the absolutely-positioned slides */}
      <div className="min-h-[75vh]" aria-hidden />

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.headline}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setActive(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active ? "w-6 bg-olive-dark" : "w-2 bg-olive-dark/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
