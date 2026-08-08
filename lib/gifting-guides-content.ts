// 4 gifting guides, one shared template (components/gifting/GiftingGuidePage.tsx)
// — same pattern as lib/guides-content.ts, kept separate so the "more
// guides" cross-links don't mix the two unrelated guide sets.
import type { Guide } from "./guides-content";

export const GIFTING_GUIDES: Record<string, Guide> = {
  "for-her": {
    slug: "for-her",
    title: "Gift Guide: For Her",
    intro: "A few easy starting points, by how well you know her jewellery taste.",
    sections: [
      { heading: "Not sure of her style?", body: "A pendant chain (Jhalak) or a simple ring (Vaada) in a mid-size works for almost anyone — easy to wear daily, easy to layer." },
      { heading: "She wears jewellery every day", body: "A stacking ring or a fine chain she can add to what she already wears." },
      { heading: "She loves a statement", body: "A pendant set (Noor) or a kada (Valaya) makes more of an entrance." },
    ],
  },
  "for-him": {
    slug: "for-him",
    title: "Gift Guide: For Him",
    intro: "Men's silver runs simpler — fewer, more deliberate choices.",
    sections: [
      { heading: "First piece of jewellery", body: "A chain (Zanjeer) in 20–22\" or a plain kada (Sankalp) — both read as everyday, not flashy." },
      { heading: "He already wears jewellery", body: "A tennis bracelet (Sitara) or a signet-style ring (Nishaan) adds range without repeating what he owns." },
    ],
  },
  occasions: {
    slug: "occasions",
    title: "Gift Guide: By Occasion",
    intro: "What to reach for, by what you're celebrating.",
    sections: [
      { heading: "Birthday", body: "Something personal — a pendant with their initial, or a ring in their size." },
      { heading: "Anniversary", body: "A pendant set or matching pieces — see Build a Gift to bundle two complementary pieces." },
      { heading: "Festive season", body: "Statement pieces — kada, pendant sets — that pair with festive outfits." },
      { heading: "Just because", body: "A gift card — no guessing required." },
    ],
  },
  budget: {
    slug: "budget",
    title: "Gift Guide: By Budget",
    intro: "Real options at every price point.",
    sections: [
      { heading: "Under ₹2,000", body: "Simple chains and thin bands." },
      { heading: "₹2,000 – ₹5,000", body: "Most rings and bracelets fall here." },
      { heading: "₹5,000 – ₹10,000", body: "Pendant sets, tennis bracelets, kada." },
      { heading: "Flexible", body: "A gift card in any amount lets them choose." },
    ],
  },
};
