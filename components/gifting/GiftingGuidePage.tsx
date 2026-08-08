import Link from "next/link";
import type { Guide } from "@/lib/guides-content";
import { GIFTING_GUIDES } from "@/lib/gifting-guides-content";

export function GiftingGuidePage({ guide }: { guide: Guide }) {
  const others = Object.values(GIFTING_GUIDES).filter((g) => g.slug !== guide.slug);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
      <p className="text-xs uppercase tracking-wide text-olive-dark">Gifting Guide</p>
      <h1 className="mt-2 font-display text-3xl">{guide.title}</h1>
      <p className="mt-3 text-text-dark/70">{guide.intro}</p>

      <div className="mt-10 space-y-8">
        {guide.sections.map((section) => (
          <div key={section.heading}>
            <h2 className="font-display text-lg">{section.heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-dark/70">{section.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 border-t border-black/10 pt-8">
        <p className="mb-3 text-xs uppercase tracking-wide text-text-dark/50">More Gifting Guides</p>
        <div className="flex flex-wrap gap-2">
          {others.map((g) => (
            <Link key={g.slug} href={`/gifting/guides/${g.slug}`} className="rounded-full border border-black/10 px-4 py-1.5 text-xs hover:border-olive-dark hover:text-olive-dark">
              {g.title.replace("Gift Guide: ", "")}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
