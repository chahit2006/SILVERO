import Link from "next/link";
import { GIFTING_GUIDES } from "@/lib/gifting-guides-content";

export default function GiftingGuidesHubPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 lg:px-8">
      <h1 className="font-display text-3xl">Gifting Guides</h1>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Object.values(GIFTING_GUIDES).map((g) => (
          <Link key={g.slug} href={`/gifting/guides/${g.slug}`} className="rounded-card border border-black/10 p-5 hover:border-olive-dark">
            <p className="font-display">{g.title}</p>
            <p className="mt-1 text-xs text-text-dark/50">{g.intro}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
