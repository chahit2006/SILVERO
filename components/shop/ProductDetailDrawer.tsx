"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Product, Category } from "@prisma/client";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/components/providers/CartProvider";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { HeartIcon, XIcon, ChevronDownIcon } from "@/components/ui/icons";
import { ProductCard } from "./ProductCard";

type FullProduct = Product & { category: Category };

const ACCORDIONS = [
  { key: "details", label: "Details" },
  { key: "care", label: "Care" },
  { key: "shipping", label: "Shipping" },
  { key: "returns", label: "Returns" },
] as const;

// PRD.md §4 / DESIGN_SYSTEM.md §7 — no standalone PDP, product detail opens
// in a drawer within the PLP. Chosen pattern per PRD's own recommendation
// ("drawer is the least layout-disruptive option for a beginner team").
export function ProductDetailDrawer({
  productId,
  onClose,
  onOpenDetail,
}: {
  productId: string | null;
  onClose: () => void;
  /** Lets "You may also like" swap the drawer to a different product without closing it. */
  onOpenDetail: (productId: string) => void;
}) {
  const { addItem } = useCart();
  const { ids: wishlistIds, toggle: toggleWishlist } = useWishlist();
  const router = useRouter();

  const [product, setProduct] = useState<FullProduct | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState<string | undefined>(undefined);
  const [openAccordion, setOpenAccordion] = useState<string | null>("details");
  const [adding, setAdding] = useState<"idle" | "added">("idle");

  useEffect(() => {
    if (!productId) return;
    setProduct(null);
    setActiveImage(0);
    setSize(undefined);
    setAdding("idle");

    fetch(`/api/products/${productId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.product) return;
        setProduct(data.product);
        // Recently-viewed isn't in API_SPEC.md — added alongside the
        // /account/recently-viewed page (see app/api/recently-viewed).
        fetch("/api/recently-viewed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        }).catch(() => {});
        fetch(`/api/products?category=${data.product.category.slug}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((related) =>
            setRelated((related?.products ?? []).filter((p: Product) => p.id !== productId).slice(0, 4)),
          );
      })
      .catch(() => {});
  }, [productId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = productId ? "hidden" : "";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [productId, onClose]);

  if (!productId) return null;

  async function handleAddToBag() {
    if (!product) return;
    await addItem({ productId: product.id, size, quantity: 1 });
    setAdding("added");
    setTimeout(() => setAdding("idle"), 1500);
  }

  async function handleBuyNow() {
    if (!product) return;
    await addItem({ productId: product.id, size, quantity: 1 });
    onClose();
    router.push("/checkout");
  }

  return (
    <div className="fixed inset-0 z-[75]">
      <button aria-label="Close" className="absolute inset-0 animate-fade-in bg-black/40" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-3xl animate-slide-in-right overflow-y-auto bg-white">
        <button aria-label="Close" onClick={onClose} className="absolute right-4 top-4 z-10 p-2">
          <XIcon />
        </button>

        {!product ? (
          <div className="grid h-full place-items-center">
            <div className="h-8 w-8 animate-pulse rounded-full bg-ivory" />
          </div>
        ) : (
          <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-2">
            {/* Gallery */}
            <div>
              <div className="relative aspect-square overflow-hidden rounded-card bg-ivory">
                {product.images[activeImage] && (
                  <Image src={product.images[activeImage]} alt={product.name} fill className="object-cover" />
                )}
                {product.images.length > 1 && (
                  <>
                    <button
                      aria-label="Previous image"
                      onClick={() => setActiveImage((i) => (i - 1 + product.images.length) % product.images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2"
                    >
                      ‹
                    </button>
                    <button
                      aria-label="Next image"
                      onClick={() => setActiveImage((i) => (i + 1) % product.images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
              {product.images.length > 1 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {product.images.slice(0, 4).map((img, i) => (
                    <button
                      key={img + i}
                      onClick={() => setActiveImage(i)}
                      className={`relative aspect-square overflow-hidden rounded-card bg-ivory ring-2 ${
                        activeImage === i ? "ring-olive-dark" : "ring-transparent"
                      }`}
                    >
                      <Image src={img} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <p className="text-xs uppercase tracking-wide text-text-dark/50">{product.category.name}</p>
              <h1 className="mt-1 font-display text-2xl uppercase">{product.name}</h1>
              <p className="mt-2 text-lg">{formatPrice(product.price)}</p>

              {product.description && <p className="mt-4 text-sm text-text-dark/70">{product.description}</p>}

              <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-text-dark/50">
                <span className="rounded-full border border-black/10 px-3 py-1">925 Sterling Silver</span>
                <span className="rounded-full border border-black/10 px-3 py-1">Lifetime Plating</span>
                <span className="rounded-full border border-black/10 px-3 py-1">Complimentary Shipping</span>
              </div>

              {product.sizeOptions.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-xs uppercase tracking-wide text-text-dark/50">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizeOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSize(opt)}
                        className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-150 ${
                          size === opt ? "border-olive-dark bg-olive-dark text-ivory" : "border-black/15"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleAddToBag}
                  className="flex-1 rounded-full bg-olive-dark py-3 text-sm uppercase tracking-wide text-ivory transition-colors duration-150 hover:bg-olive-dark/90"
                >
                  {adding === "added" ? "✓ Added" : "Add to Bag"}
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 rounded-full border border-olive-dark py-3 text-sm uppercase tracking-wide text-olive-dark"
                >
                  Buy Now
                </button>
                <button
                  aria-label="Toggle wishlist"
                  onClick={() => toggleWishlist(product.id)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10"
                >
                  <HeartIcon filled={wishlistIds.has(product.id)} className={wishlistIds.has(product.id) ? "text-olive-dark" : ""} />
                </button>
              </div>

              <p className="mt-3 text-xs text-text-dark/50">
                Complimentary shipping across India · Standard delivery in 5–7 days
              </p>

              <div className="mt-6 divide-y divide-black/10 border-t border-black/10">
                {ACCORDIONS.map((section) => (
                  <div key={section.key}>
                    <button
                      onClick={() => setOpenAccordion(openAccordion === section.key ? null : section.key)}
                      className="flex w-full items-center justify-between py-3 text-sm uppercase tracking-wide"
                    >
                      {section.label}
                      <ChevronDownIcon
                        width={16}
                        height={16}
                        className={`transition-transform duration-300 ${
                          openAccordion === section.key ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {openAccordion === section.key && (
                      <p className="pb-4 text-sm text-text-dark/60">{accordionContent(section.key, product)}</p>
                    )}
                  </div>
                ))}
              </div>

              {related.length > 0 && (
                <div className="mt-8">
                  <p className="mb-3 font-display text-sm uppercase tracking-wide">You may also like</p>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-2">
                    {related.map((p) => (
                      <ProductCard key={p.id} product={p} onOpenDetail={onOpenDetail} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function accordionContent(key: string, product: FullProduct) {
  switch (key) {
    case "details":
      return `${product.material ?? "925 Sterling Silver"}${product.stone ? ` · ${product.stone}` : ""}. Handcrafted, hallmarked 925 sterling silver.`;
    case "care":
      return "Store in a dry, airtight pouch away from direct sunlight. Avoid contact with perfume, water, and chemicals. Polish gently with a soft cloth.";
    case "shipping":
      return "Complimentary shipping across India. Standard delivery in 5–7 business days; express options available at checkout.";
    case "returns":
      return "Easy 7-day returns on unworn items in original packaging. See our Returns policy for full details.";
    default:
      return "";
  }
}
