import { getProducts } from "@/lib/products";
import { Hero } from "@/components/home/Hero";
import { TrustBar } from "@/components/home/TrustBar";
import { GenderCards } from "@/components/home/GenderCards";
import { ProductGridSection } from "@/components/home/ProductGridSection";
import { StorytellingCards } from "@/components/home/StorytellingCards";
import { ShopTheLook } from "@/components/home/ShopTheLook";
import { BrandStoryBlock } from "@/components/home/BrandStoryBlock";
import { AsSeenIn } from "@/components/home/AsSeenIn";
import { CircleCTA } from "@/components/home/CircleCTA";
import { InstagramGrid } from "@/components/home/InstagramGrid";

export const dynamic = "force-dynamic";

// DESIGN_SYSTEM.md §5 — 12 homepage sections, in order.
export default async function HomePage() {
  const [{ products: newArrivals }, { products: bestsellers }] = await Promise.all([
    getProducts({ isNew: true, sort: "newest", page: 1 }),
    getProducts({ isBestseller: true, page: 1 }),
  ]);

  return (
    <>
      <Hero /> {/* 1 */}
      <TrustBar /> {/* 2 */}
      <GenderCards /> {/* 3 */}
      <ProductGridSection title="New Arrivals" products={newArrivals.slice(0, 4)} viewAllHref="/shop/new" /> {/* 4 */}
      <StorytellingCards /> {/* 5 */}
      <ProductGridSection title="Bestsellers" products={bestsellers.slice(0, 4)} viewAllHref="/shop/bestsellers" /> {/* 6 */}
      <ShopTheLook products={bestsellers} /> {/* 7 */}
      <BrandStoryBlock /> {/* 8 */}
      <AsSeenIn /> {/* 9 */}
      <TrustBar detailed /> {/* 10 */}
      <CircleCTA /> {/* 11 */}
      <InstagramGrid /> {/* 12 */}
    </>
  );
}
