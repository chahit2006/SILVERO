import Image from "next/image";
import { StaticPage } from "@/components/static/StaticPage";

// Hero + supporting image added per client request — kept outside
// StaticPage (shared by every other static page) so this stays scoped to
// /about/craft only.
export default function CraftPage() {
  return (
    <>
      <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[21/9]">
        <Image
          src="/placeholders/craft-hero.png"
          alt="Raw 925 sterling silver being shaped by hand"
          fill
          className="object-cover"
          priority
        />
      </div>
      <StaticPage title="The Craft">
        <h2>From raw silver to finished piece</h2>
        <p>
          Every piece starts as raw 925 sterling silver, alloyed for strength, then shaped, set, and
          polished by hand before final quality checks.
        </p>
        <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-card">
          <Image
            src="/placeholders/craft-supporting.png"
            alt="A finished silver piece being hand-polished"
            fill
            className="object-cover"
          />
        </div>
        <h2>Hallmarked, always</h2>
        <p>See our Hallmark Guide for what the 925 stamp certifies and why it matters.</p>
      </StaticPage>
    </>
  );
}
