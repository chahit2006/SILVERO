"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Product, Category, ProductSizeStock } from "@prisma/client";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/components/providers/CartProvider";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { useCompare } from "@/components/providers/CompareProvider";
import { HeartIcon, XIcon, ChevronDownIcon, WhatsAppIcon } from "@/components/ui/icons";
import { ProductCard } from "./ProductCard";

type FullProduct = Product & { category: Category; sizeStocks?: ProductSizeStock[] };

const ACCORDIONS = [
  { key: "details", label: "Details" },
  { key: "care", label: "Care" },
  { key: "shipping", label: "Shipping" },
] as const;

// SILVERO_Full_Spec_Status_1.md Part 1 #8 — the "Naap Guide" link. Mapped by
// category rather than shown blindly: a chain shouldn't link to the ring-size
// guide. A category that isn't listed gets no link at all, which is better
// than a confidently wrong one. Guide slugs come from lib/guides-content.ts.
const SIZE_GUIDE_BY_CATEGORY: Record<string, string> = {
  nishaan: "ring-size",
  vaada: "ring-size",
  kalai: "bracelet-size",
  sitara: "bracelet-size",
  sankalp: "bracelet-size",
  valaya: "bracelet-size",
  zanjeer: "necklace-length",
  resham: "necklace-length",
  jhalak: "necklace-length",
};

/** POST /api/cart caps quantity at 10 — mirror that here so the stepper can't
 *  offer a value the server will silently clamp. */
const MAX_QTY = 10;

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
  const { ids: compareIds, toggle: toggleCompare, isFull: compareFull } = useCompare();
  const router = useRouter();

  const [product, setProduct] = useState<FullProduct | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>("details");
  const [adding, setAdding] = useState<"idle" | "added">("idle");
  const [zoomed, setZoomed] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setProduct(null);
    setActiveImage(0);
    setSize(undefined);
    setQuantity(1);
    setAdding("idle");
    setZoomed(false);
    setShareOpen(false);

    fetch(`/api/products/${productId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.product) return;
        const loaded: FullProduct = data.product;
        setProduct(loaded);
        // Recently-viewed isn't in API_SPEC.md — added alongside the
        // /account/recently-viewed page (see app/api/recently-viewed).
        fetch("/api/recently-viewed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        }).catch(() => {});
        fetch(`/api/products?category=${loaded.category.slug}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((res) => {
            const pool: Product[] = (res?.products ?? []).filter((p: Product) => p.id !== productId);
            // Part 1 #17 — "Aur Dekhein" is meant to be price-matched, not
            // just same-category. Prefer items within ±40% of this product's
            // price; fall back to the unfiltered pool if that leaves too few
            // to fill the row (a thin catalogue shouldn't empty the section).
            const band = pool.filter(
              (p) => p.price >= loaded.price * 0.6 && p.price <= loaded.price * 1.4,
            );
            setRelated((band.length >= 4 ? band : pool).slice(0, 8));
          });
      })
      .catch(() => {});
  }, [productId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // Esc closes the topmost layer first — lightbox before the whole drawer,
      // or the shopper loses their place just trying to dismiss a zoom.
      if (zoomed) setZoomed(false);
      else if (shareOpen) setShareOpen(false);
      else onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = productId ? "hidden" : "";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [productId, onClose, zoomed, shareOpen]);

  if (!productId) return null;

  // Part 1 #8 — a size is out of stock when its ProductSizeStock row is at or
  // below zero. Products with no rows at all (the genuinely sizeless
  // categories, and anything not yet given per-size counts) fall through as
  // "in stock", which keeps existing behaviour rather than greying out a
  // whole catalogue that simply hasn't been counted yet.
  const stockBySize = new Map((product?.sizeStocks ?? []).map((row) => [row.size, row.stock]));
  const hasSizeStockData = stockBySize.size > 0;
  const isSizeOutOfStock = (label: string) =>
    hasSizeStockData && (stockBySize.get(label) ?? 0) <= 0;

  const guideSlug = product ? SIZE_GUIDE_BY_CATEGORY[product.category.slug] : undefined;
  const genderHref = product?.category.gender === "NAR" ? "/shop/nar" : "/shop/nari";
  const genderLabel = product?.category.gender === "NAR" ? "Nar" : "Nari";
  const comparing = product ? compareIds.includes(product.id) : false;

  async function handleAddToBag() {
    if (!product) return;
    await addItem({ productId: product.id, size, quantity });
    setAdding("added");
    setTimeout(() => setAdding("idle"), 1500);
  }

  async function handleBuyNow() {
    if (!product) return;
    await addItem({ productId: product.id, size, quantity });
    onClose();
    router.push("/checkout");
  }

  // Part 1 #13. NOTE: there is deliberately no standalone product URL
  // (PRD.md §4 — detail is a drawer inside the PLP), and the PLP has no
  // ?product= deep link, so this shares the current listing URL with the
  // product named in the message text. Making this a true per-product link
  // needs deep-link routing in ProductListingPage.tsx — flagged, not faked.
  function shareUrl() {
    return typeof window === "undefined" ? "" : window.location.href;
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked (insecure context / permissions) — leave the popover
      // open so the shopper can still copy from the address bar themselves
    }
  }

  return (
    <div className="fixed inset-0 z-[75]">
      <button aria-label="Close" className="absolute inset-0 animate-fade-in bg-black/40" onClick={onClose} />

      <div className="absolute right-0 top-0 flex h-full w-full max-w-3xl animate-slide-in-right flex-col overflow-y-auto bg-white">
        <button aria-label="Close" onClick={onClose} className="absolute right-4 top-4 z-10 p-2">
          <XIcon />
        </button>

        {!product ? (
          <div className="grid h-full place-items-center">
            <div className="h-8 w-8 animate-pulse rounded-full bg-ivory" />
          </div>
        ) : (
          <>
            {/* Breadcrumb — Part 1 #1 */}
            <nav
              aria-label="Breadcrumb"
              className="px-6 pt-6 text-[11px] uppercase tracking-wide text-text-dark/50 sm:px-8"
            >
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link href="/" className="hover:text-text-dark">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href={genderHref} className="hover:text-text-dark">
                    {genderLabel}
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href={`/shop/${product.category.slug}`} className="hover:text-text-dark">
                    {product.category.name}
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-text-dark/80">
                  {product.name}
                </li>
              </ol>
            </nav>

            <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-2">
              {/* Gallery */}
              <div>
                <div className="relative aspect-square overflow-hidden rounded-card bg-ivory">
                  {product.images[activeImage] && (
                    <Image src={product.images[activeImage]} alt={product.name} fill className="object-cover" />
                  )}

                  {/* Zoom — DESIGN_SYSTEM.md §7 "main image with prev/next arrows + zoom icon" */}
                  {product.images[activeImage] && (
                    <button
                      aria-label="Zoom image"
                      onClick={() => setZoomed(true)}
                      className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-sm shadow-sm transition-colors duration-150 hover:bg-white"
                    >
                      <ZoomIcon />
                    </button>
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
                {/* Part 1 #3 — category links to its own page rather than sitting as dead grey text */}
                <Link
                  href={`/shop/${product.category.slug}`}
                  className="text-xs uppercase tracking-wide text-text-dark/50 underline-offset-4 hover:text-text-dark hover:underline"
                >
                  {product.category.name}
                </Link>
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
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <p className="text-xs uppercase tracking-wide text-text-dark/50">Size</p>
                      {guideSlug && (
                        <Link
                          href={`/guides/${guideSlug}`}
                          className="text-xs text-olive-dark underline underline-offset-4"
                        >
                          Naap Guide
                        </Link>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.sizeOptions.map((opt) => {
                        const outOfStock = isSizeOutOfStock(opt);
                        return (
                          <button
                            key={opt}
                            onClick={() => !outOfStock && setSize(opt)}
                            disabled={outOfStock}
                            aria-label={outOfStock ? `Size ${opt} — out of stock` : `Size ${opt}`}
                            className={`min-w-[3rem] rounded-md border px-3.5 py-2 text-sm transition-colors duration-150 ${
                              outOfStock
                                ? "cursor-not-allowed border-black/10 text-text-dark/30 line-through"
                                : size === opt
                                  ? "border-olive-dark bg-olive-dark text-ivory"
                                  : "border-black/15 hover:border-olive-dark"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity stepper — Part 1 #10 */}
                <div className="mt-5">
                  <p className="mb-2 text-xs uppercase tracking-wide text-text-dark/50">Quantity</p>
                  <div className="inline-flex items-center rounded-full border border-black/15">
                    <button
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="px-3.5 py-2 text-lg leading-none disabled:text-text-dark/25"
                    >
                      −
                    </button>
                    <span aria-live="polite" className="min-w-[2.5rem] text-center text-sm">
                      {quantity}
                    </span>
                    <button
                      aria-label="Increase quantity"
                      onClick={() => setQuantity((q) => Math.min(MAX_QTY, q + 1))}
                      disabled={quantity >= MAX_QTY}
                      className="px-3.5 py-2 text-lg leading-none disabled:text-text-dark/25"
                    >
                      +
                    </button>
                  </div>
                </div>

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
                </div>

                {/* Compare — Part 1 #11. Uses the same CompareProvider the shop
                    grid checkbox does, so the two entry points stay in sync. */}
                <button
                  onClick={() => toggleCompare(product.id)}
                  disabled={!comparing && compareFull}
                  className={`mt-3 w-full rounded-full border py-2.5 text-xs uppercase tracking-wide transition-colors duration-150 ${
                    comparing
                      ? "border-olive-dark bg-olive-dark/10 text-olive-dark"
                      : "border-black/15 text-text-dark/70 hover:border-olive-dark disabled:text-text-dark/30"
                  }`}
                >
                  {comparing ? "✓ Added to Compare" : compareFull ? "Compare list full" : "Add to Compare"}
                </button>

                {/* Wishlist + Share — Part 1 #13 */}
                <div className="relative mt-3 flex items-center gap-2">
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border border-black/15 py-2.5 text-xs uppercase tracking-wide text-text-dark/70 transition-colors duration-150 hover:border-olive-dark"
                  >
                    <HeartIcon
                      filled={wishlistIds.has(product.id)}
                      width={16}
                      height={16}
                      className={wishlistIds.has(product.id) ? "text-olive-dark" : ""}
                    />
                    {wishlistIds.has(product.id) ? "Saved to Wishlist" : "Save to Wishlist"}
                  </button>

                  <button
                    onClick={() => setShareOpen((v) => !v)}
                    aria-expanded={shareOpen}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border border-black/15 py-2.5 text-xs uppercase tracking-wide text-text-dark/70 transition-colors duration-150 hover:border-olive-dark"
                  >
                    <ShareIcon />
                    Share
                  </button>

                  {shareOpen && (
                    <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-card border border-black/10 bg-white p-2 shadow-lg">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`${product.name} — SILVERO.925 ${shareUrl()}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-ivory"
                      >
                        <WhatsAppIcon width={16} height={16} />
                        WhatsApp
                      </a>
                      <a
                        href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl())}&description=${encodeURIComponent(product.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-ivory"
                      >
                        <span aria-hidden="true" className="w-4 text-center">
                          P
                        </span>
                        Pinterest
                      </a>
                      <button
                        onClick={handleCopyLink}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-ivory"
                      >
                        <span aria-hidden="true" className="w-4 text-center">
                          ⧉
                        </span>
                        {copied ? "Link copied" : "Copy link"}
                      </button>
                    </div>
                  )}
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
                        <div className="pb-4 text-sm text-text-dark/60">
                          {accordionContent(section.key, product)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {related.length > 0 && (
                  <div className="mt-8">
                    <p className="mb-3 font-display text-sm uppercase tracking-wide">Aur Dekhein</p>
                    {/* Part 1 #17 — horizontal carousel, not a static grid. Native
                        scroll-snap keeps this dependency-free (CLAUDE.md #1). */}
                    <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2">
                      {related.map((p) => (
                        <div key={p.id} className="w-36 shrink-0 snap-start sm:w-40">
                          <ProductCard product={p} onOpenDetail={onOpenDetail} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile sticky bar — Part 1 #21. Sticky within the drawer's own
                scroll container rather than fixed to the viewport, so it can't
                outlive the drawer or sit over the page behind it. */}
            <div className="sticky bottom-0 z-10 mt-auto flex items-center gap-3 border-t border-black/10 bg-white/95 px-6 py-3 backdrop-blur md:hidden">
              <div className="min-w-0">
                <p className="truncate text-[11px] uppercase tracking-wide text-text-dark/50">{product.name}</p>
                <p className="text-sm">{formatPrice(product.price * quantity)}</p>
              </div>
              <button
                onClick={handleAddToBag}
                className="ml-auto shrink-0 rounded-full bg-olive-dark px-6 py-3 text-sm uppercase tracking-wide text-ivory"
              >
                {adding === "added" ? "✓ Added" : "Add to Bag"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Lightbox — Part 1 #2 */}
      {zoomed && product?.images[activeImage] && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
          <button aria-label="Close zoom" className="absolute inset-0" onClick={() => setZoomed(false)} />
          <div className="relative h-full max-h-[85vh] w-full max-w-4xl">
            <Image
              src={product.images[activeImage]}
              alt={product.name}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>
          <button
            aria-label="Close zoom"
            onClick={() => setZoomed(false)}
            className="absolute right-4 top-4 rounded-full bg-white/90 p-2"
          >
            <XIcon />
          </button>
        </div>
      )}
    </div>
  );
}

function ZoomIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <circle cx={11} cy={11} r={7} />
      <path d="M20 20l-3.5-3.5M11 8v6M8 11h6" strokeLinecap="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <circle cx={18} cy={5} r={3} />
      <circle cx={6} cy={12} r={3} />
      <circle cx={18} cy={19} r={3} />
      <path d="M8.6 10.7l6.8-4M8.6 13.3l6.8 4" strokeLinecap="round" />
    </svg>
  );
}

function accordionContent(key: string, product: FullProduct) {
  switch (key) {
    case "details":
      // Part 1 #15 — structured list rather than one freeform sentence. Only
      // fields that actually exist on Product are listed; nothing is invented
      // to pad the list out.
      return (
        <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1.5">
          <dt className="text-text-dark/45">Material</dt>
          <dd>{product.material ?? "925 Sterling Silver"}</dd>
          {product.stone && (
            <>
              <dt className="text-text-dark/45">Stone</dt>
              <dd>{product.stone}</dd>
            </>
          )}
          {product.weightGrams != null && (
            <>
              <dt className="text-text-dark/45">Weight</dt>
              <dd>{product.weightGrams}g</dd>
            </>
          )}
          {product.occasion && (
            <>
              <dt className="text-text-dark/45">Occasion</dt>
              <dd>{product.occasion}</dd>
            </>
          )}
          <dt className="text-text-dark/45">Hallmark</dt>
          <dd>Hallmarked 925 sterling silver</dd>
        </dl>
      );
    case "care":
      return (
        <p>
          Store in a dry, airtight pouch away from direct sunlight. Avoid contact with perfume, water, and
          chemicals. Polish gently with a soft cloth.{" "}
          <Link href="/guides/care" className="text-olive-dark underline underline-offset-4">
            Read the full care guide
          </Link>
          .
        </p>
      );
    case "shipping":
      return (
        <p>
          Complimentary shipping across India. Standard delivery in 5–7 business days; express options
          available at checkout.
        </p>
      );
    default:
      return null;
  }
}
