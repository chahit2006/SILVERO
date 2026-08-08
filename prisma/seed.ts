// Placeholder catalog data — there's no real product photography or copy
// from the client yet. This exists so the shop/homepage/search pages have
// something real to query via Prisma instead of hardcoded arrays in
// components. Swap for real product data before launch.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type CategorySeed = {
  gender: "NAR" | "NARI";
  slug: string;
  name: string;
  englishName: string;
  image: string; // /placeholders/*.svg
  sizeOptions: string[];
};

const CATEGORIES: CategorySeed[] = [
  { gender: "NAR", slug: "zanjeer", name: "Zanjeer", englishName: "Chains", image: "/placeholders/chain.svg", sizeOptions: ["18\"", "20\"", "22\"", "24\""] },
  { gender: "NAR", slug: "nishaan", name: "Nishaan", englishName: "Rings", image: "/placeholders/ring.svg", sizeOptions: ["8", "10", "12", "14", "16", "18", "20", "22"] },
  { gender: "NAR", slug: "sitara", name: "Sitara", englishName: "Tennis Bracelets", image: "/placeholders/bracelet.svg", sizeOptions: [] },
  { gender: "NAR", slug: "sankalp", name: "Sankalp", englishName: "Kada", image: "/placeholders/kada.svg", sizeOptions: ["2.4\"", "2.6\"", "2.8\""] },
  { gender: "NARI", slug: "resham", name: "Resham", englishName: "Chains", image: "/placeholders/chain.svg", sizeOptions: ["14\"", "16\"", "18\""] },
  { gender: "NARI", slug: "vaada", name: "Vaada", englishName: "Rings", image: "/placeholders/ring.svg", sizeOptions: ["8", "10", "12", "14", "16", "18"] },
  { gender: "NARI", slug: "noor", name: "Noor", englishName: "Pendant Sets", image: "/placeholders/pendant.svg", sizeOptions: [] },
  { gender: "NARI", slug: "jhalak", name: "Jhalak", englishName: "Pendant Chains", image: "/placeholders/pendant.svg", sizeOptions: ["16\"", "18\""] },
  { gender: "NARI", slug: "kalai", name: "Kalai", englishName: "Bracelets", image: "/placeholders/bracelet.svg", sizeOptions: [] },
  { gender: "NARI", slug: "valaya", name: "Valaya", englishName: "Kada", image: "/placeholders/kada.svg", sizeOptions: ["2.2\"", "2.4\"", "2.6\""] },
];

const MATERIALS = ["925 Sterling Silver", "925 Sterling Silver, Gold-Plated"];
const STONES = [null, "Cubic Zirconia", "Moissanite"];
const OCCASIONS = ["Everyday", "Festive", "Wedding", "Gifting"];
const ADJECTIVES = ["Classic", "Woven", "Minimal", "Studded", "Braided", "Signature"];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("Seeding categories + placeholder products...");

  for (const cat of CATEGORIES) {
    const category = await db.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        gender: cat.gender,
        slug: cat.slug,
        name: cat.name,
        englishName: cat.englishName,
      },
    });

    for (let i = 0; i < 4; i++) {
      const adjective = ADJECTIVES[(i + cat.slug.length) % ADJECTIVES.length];
      const name = `${adjective} ${cat.englishName.replace(/s$/, "")}`;
      const slug = slugify(`${cat.slug}-${name}-${i}`);
      const price = 1500 + ((i * 733 + cat.slug.length * 211) % 12000);

      await db.product.upsert({
        where: { slug },
        update: {},
        create: {
          categoryId: category.id,
          name,
          slug,
          price,
          images: [cat.image],
          material: MATERIALS[i % MATERIALS.length],
          stone: STONES[i % STONES.length],
          occasion: OCCASIONS[i % OCCASIONS.length],
          description:
            "Handcrafted in 925 sterling silver. Placeholder description — replace with real copy before launch.",
          sizeOptions: cat.sizeOptions,
          stock: 15 + i * 5,
          isBestseller: i === 0,
          isNew: i === 3,
        },
      });
    }
  }

  const productCount = await db.product.count();
  console.log(`Done. ${CATEGORIES.length} categories, ${productCount} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
