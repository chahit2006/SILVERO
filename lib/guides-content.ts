// Content for the 9 guide pages, all sharing one template component
// (components/guides/GuidePage.tsx) — DIRECTORY_STRUCTURE.md: "9 guide
// pages share one template." Generic, factual jewellery-care/sizing content;
// nothing brand-specific that would need legal review, unlike the policy
// pages in app/(static)/.

export type GuideSection = { heading: string; body: string };
export type Guide = { slug: string; title: string; intro: string; sections: GuideSection[] };

export const GUIDES: Record<string, Guide> = {
  "ring-size": {
    slug: "ring-size",
    title: "Ring Size Guide",
    intro: "Find your ring size at home in under five minutes, no printer required.",
    sections: [
      {
        heading: "Measure a ring you already own",
        body: "Take a ring that fits the intended finger well and measure its inner diameter in millimetres with a ruler. Match that to the size chart below.",
      },
      {
        heading: "Or measure your finger directly",
        body: "Wrap a strip of paper or string around the base of your finger, mark where it overlaps, then measure that length in millimetres. Measure at the end of the day, when fingers are at their largest.",
      },
      {
        heading: "Our size range",
        body: "SILVERO.925 rings are available in sizes 8–22 (Indian sizing). If you're between sizes, size up — a slightly looser ring is more comfortable than a tight one.",
      },
    ],
  },
  "bracelet-size": {
    slug: "bracelet-size",
    title: "Bracelet & Kada Size Guide",
    intro: "Bracelets and kada are sized differently — here's how to get a fit you'll actually wear.",
    sections: [
      {
        heading: "Measure your wrist",
        body: "Wrap a soft measuring tape (or string, then measure the string) snugly around your wrist, just below the wrist bone. That's your base measurement.",
      },
      {
        heading: "Choose your fit",
        body: "For a snug fit, use your wrist measurement as-is. For a looser, more relaxed drape, add 1–1.5cm. Tennis bracelets (Sitara) fit closer to the wrist than chain bracelets (Kalai).",
      },
      {
        heading: "Kada sizing",
        body: "Kada are rigid and don't adjust — measure across your widest knuckle (the point your hand has to pass through) rather than your wrist alone.",
      },
    ],
  },
  "necklace-length": {
    slug: "necklace-length",
    title: "Necklace & Chain Length Guide",
    intro: "The right length depends on your neckline and what you're layering it with.",
    sections: [
      {
        heading: "Common lengths",
        body: "14–16\": sits at the collarbone, best for high necklines. 18\": the most versatile everyday length. 20–22\": rests just above the bust, pairs well with layering. 24\"+: a statement length, works over most necklines.",
      },
      {
        heading: "Layering multiple chains",
        body: "Stagger lengths by at least 2\" between each chain so pendants and links don't tangle — e.g. 16\" + 18\" + 22\".",
      },
    ],
  },
  care: {
    slug: "care",
    title: "Jewellery Care Guide",
    intro: "925 sterling silver rewards a little care — here's how to keep it looking new.",
    sections: [
      {
        heading: "Storage",
        body: "Store pieces in an airtight pouch or box away from direct sunlight and humidity. Keep chains separated so they don't tangle or scratch each other.",
      },
      {
        heading: "What to avoid",
        body: "Remove jewellery before swimming, showering, or applying perfume/lotion — chlorine, salt water, and chemicals accelerate tarnishing and can dull plating over time.",
      },
      {
        heading: "Cleaning",
        body: "Wipe gently with a soft, lint-free cloth after each wear. For light tarnish, a dedicated silver polishing cloth works well — avoid abrasive cleaners or ultrasonic cleaners on plated or stone-set pieces.",
      },
    ],
  },
  silver: {
    slug: "silver",
    title: "Understanding 925 Sterling Silver",
    intro: "What \"925\" actually means, and why it's the standard for fine silver jewellery.",
    sections: [
      {
        heading: "What does 925 mean?",
        body: "925 sterling silver is 92.5% pure silver alloyed with 7.5% other metals (usually copper) for strength — pure silver on its own is too soft for everyday jewellery.",
      },
      {
        heading: "Why alloy it at all?",
        body: "The alloy makes pieces durable enough for daily wear while keeping silver's natural shine. It's the same standard used by fine jewellers worldwide.",
      },
      {
        heading: "Gold-plated 925",
        body: "Some pieces are 925 silver with a gold plating layer over it — giving the look of gold jewellery at a fraction of the cost, backed by real sterling silver underneath.",
      },
    ],
  },
  hallmark: {
    slug: "hallmark",
    title: "Hallmark Guide",
    intro: "How to read a silver hallmark, and why it matters.",
    sections: [
      {
        heading: "What a hallmark certifies",
        body: "A hallmark is an official stamp certifying the metal's purity — for silver, a \"925\" mark confirms 92.5% silver content, verified against a recognised standard.",
      },
      {
        heading: "BIS hallmarking in India",
        body: "The Bureau of Indian Standards (BIS) is India's hallmarking authority for precious metals. Look for the BIS mark alongside the purity grade when buying silver.",
      },
    ],
  },
  materials: {
    slug: "materials",
    title: "Materials Guide",
    intro: "What's actually in your jewellery — metals and stones, explained simply.",
    sections: [
      {
        heading: "925 Sterling Silver",
        body: "Our base metal for every piece — see the Silver Guide for details on what \"925\" means.",
      },
      {
        heading: "Gold-Plated 925",
        body: "925 silver with a gold-tone plating layer. Plating can wear over years of daily use — see the Care Guide for how to extend its life.",
      },
      {
        heading: "Cubic Zirconia",
        body: "A lab-created stone that closely mimics diamond brilliance at a fraction of the cost — durable, and ethically conflict-free by nature.",
      },
      {
        heading: "Moissanite",
        body: "Another lab-created stone, prized for exceptional sparkle and hardness — a step up from cubic zirconia in both.",
      },
    ],
  },
  styling: {
    slug: "styling",
    title: "Styling Guide",
    intro: "A few simple rules for stacking and mixing silver jewellery well.",
    sections: [
      {
        heading: "Stacking rings",
        body: "Mix widths and textures rather than repeating the same band — a thin band, a signet, and a stone-set piece read as intentional, not accidental.",
      },
      {
        heading: "Layering necklaces",
        body: "Vary lengths (see the Necklace Length Guide) and keep one piece as the visual anchor — usually the shortest or most detailed one.",
      },
      {
        heading: "Mixing bracelets and kada",
        body: "A rigid kada anchors well against 2–3 thinner chain bracelets on the same wrist — keep the total look balanced rather than crowding one side.",
      },
    ],
  },
  occasions: {
    slug: "occasions",
    title: "Occasions Guide",
    intro: "What to reach for, by occasion.",
    sections: [
      {
        heading: "Everyday",
        body: "Lightweight chains, small studs and simple bands — pieces you won't think twice about wearing daily.",
      },
      {
        heading: "Festive",
        body: "Pendant sets and statement kada carry festive weight without needing gold — layer with everyday pieces for the rest of the outfit.",
      },
      {
        heading: "Wedding",
        body: "Stone-set pieces (cubic zirconia or moissanite) photograph well and pair naturally with heavier traditional outfits.",
      },
      {
        heading: "Gifting",
        body: "See the Gifting section for gift cards, wrapping, and curated picks by recipient and budget.",
      },
    ],
  },
};
