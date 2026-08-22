"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category, Product, ProductSizeStock } from "@prisma/client";
import type { ProductAttributeOptions } from "@/lib/attributes";
import { formatPrice } from "@/lib/format";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type SizeRow = { size: string; stock: string };

// PRODUCT_MGMT_PHASE_PLAN.md Phase 3 — one row per Product.sizeOptions
// entry. Falls back to sizeOptions with stock "0" only for the (post-
// migration) unexpected case where a sized product somehow has no
// ProductSizeStock rows yet, so the form never silently drops a size.
function initialSizeRows(product?: Product & { sizeStocks?: ProductSizeStock[] }): SizeRow[] {
  if (!product) return [];
  if (product.sizeStocks && product.sizeStocks.length > 0) {
    return product.sizeStocks.map((s) => ({ size: s.size, stock: s.stock.toString() }));
  }
  return product.sizeOptions.map((size) => ({ size, stock: "0" }));
}

// ADMIN_PANEL_SPEC.md §3 — one shared form for both /admin/products/new and
// /admin/products/[id]/edit.
export function ProductForm({
  categories,
  attributeOptions,
  product,
}: {
  categories: Category[];
  /** FILTER_SPEC_IMPLEMENTATION.md Part 1 — Finish/Stone/Occasion are no
   *  longer free text; they come from the Attributes Manager
   *  (/admin/attributes) so the same values power the shop filters. */
  attributeOptions: ProductAttributeOptions;
  product?: Product & { sizeStocks?: ProductSizeStock[] };
}) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit); // don't auto-overwrite an existing slug
  const [sku, setSku] = useState(product?.sku ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [stock, setStock] = useState(product?.stock?.toString() ?? "0");
  const [material, setMaterial] = useState(product?.material ?? "");
  const [stone, setStone] = useState(product?.stone ?? "");
  const [occasion, setOccasion] = useState(product?.occasion ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [sizeRows, setSizeRows] = useState<SizeRow[]>(() => initialSizeRows(product));
  const [weightGrams, setWeightGrams] = useState(product?.weightGrams?.toString() ?? "");
  const [isBestseller, setIsBestseller] = useState(product?.isBestseller ?? false);
  const [isNew, setIsNew] = useState(product?.isNew ?? false);
  const [existingImages, setExistingImages] = useState<string[]>(product?.images ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingBarcodeImage, setExistingBarcodeImage] = useState<string | null>(product?.barcodeImage ?? null);
  const [barcodeFile, setBarcodeFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("slug", slug);
    if (sku.trim()) formData.set("sku", sku.trim());
    formData.set("categoryId", categoryId);
    formData.set("price", price);
    formData.set("stock", stock);
    // Always sent, unlike sku/description: now that these are dropdowns with
    // a "— None —" entry, clearing one has to actually clear it on the
    // product (the API maps "" to null). Omitting the key would silently keep
    // the old value, which is what the old free-text inputs did.
    formData.set("material", material);
    formData.set("stone", stone);
    formData.set("occasion", occasion);
    if (description) formData.set("description", description);
    // PRODUCT_MGMT_PHASE_PLAN.md Phase 3 — replaces the old comma-separated
    // sizeOptions text field. Blank size labels are dropped here so an empty
    // trailing row (from clicking "Add size" and not filling it in) doesn't
    // get sent; the API also drops/validates on its own, this is just so the
    // common case doesn't round-trip an error.
    const cleanedSizeRows = sizeRows
      .map((r) => ({ size: r.size.trim(), stock: Number(r.stock) || 0 }))
      .filter((r) => r.size.length > 0);
    formData.set("sizeStocks", JSON.stringify(cleanedSizeRows));
    if (weightGrams) formData.set("weightGrams", weightGrams);
    formData.set("isBestseller", String(isBestseller));
    formData.set("isNew", String(isNew));
    if (isEdit) formData.set("existingImages", JSON.stringify(existingImages));
    newFiles.forEach((f) => formData.append("images", f));
    // PRODUCT_MGMT_PHASE_PLAN.md Phase 1 — barcode is a single file, separate
    // from the images gallery, with its own "keep/remove" state.
    if (isEdit) formData.set("keepBarcodeImage", String(Boolean(existingBarcodeImage)));
    if (barcodeFile) formData.set("barcodeImage", barcodeFile);

    try {
      const res = await fetch(isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products", {
        method: isEdit ? "PATCH" : "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <Field label="Name">
        <input required value={name} onChange={(e) => handleNameChange(e.target.value)} className={inputClass} />
      </Field>

      <Field label="Slug">
        <input
          required
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          pattern="[a-z0-9-]+"
          className={inputClass}
        />
      </Field>

      <Field label="Product ID / SKU (optional, unique — letters, numbers, hyphens, underscores)">
        <input
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          pattern="[A-Za-z0-9_-]+"
          maxLength={64}
          placeholder="e.g. VAA-0104"
          className={inputClass}
        />
      </Field>

      <Field label="Category">
        <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.gender} — {c.name} ({c.englishName})
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (₹)">
          <input required type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
        </Field>
        <Field label={sizeRows.length > 0 ? "Stock (sizeless fallback — see per-size stock below)" : "Stock"}>
          <input required type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <AttributeField label="Finish / Material" value={material} options={attributeOptions.material} onChange={setMaterial} />
        <AttributeField label="Stone" value={stone} options={attributeOptions.stone} onChange={setStone} />
        <AttributeField label="Occasion" value={occasion} options={attributeOptions.occasion} onChange={setOccasion} />
      </div>
      <p className="-mt-2 text-xs text-text-dark/40">
        Manage these options in{" "}
        <Link href="/admin/attributes" className="underline">
          Filter Attributes
        </Link>
        .
      </p>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-text-dark/60">Sizes &amp; Per-Size Stock (optional)</p>
        {sizeRows.length > 0 && (
          <div className="mb-2 space-y-2">
            {sizeRows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={row.size}
                  onChange={(e) =>
                    setSizeRows((rows) => rows.map((r, ri) => (ri === i ? { ...r, size: e.target.value } : r)))
                  }
                  placeholder='e.g. 16 or 20"'
                  className={`${inputClass} flex-1`}
                />
                <input
                  type="number"
                  min={0}
                  value={row.stock}
                  onChange={(e) =>
                    setSizeRows((rows) => rows.map((r, ri) => (ri === i ? { ...r, stock: e.target.value } : r)))
                  }
                  placeholder="Stock"
                  className={`${inputClass} w-28`}
                />
                <button
                  type="button"
                  onClick={() => setSizeRows((rows) => rows.filter((_, ri) => ri !== i))}
                  className="shrink-0 text-xs uppercase tracking-wide text-text-dark/50 underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setSizeRows((rows) => [...rows, { size: "", stock: "0" }])}
          className="text-xs uppercase tracking-wide text-olive-dark underline"
        >
          + Add size
        </button>
        <p className="mt-1 text-xs text-text-dark/40">
          Leave empty for products that don&apos;t come in sizes (uses the flat Stock field above instead).
        </p>
      </div>

      <Field label="Weight in grams (optional — used for Shiprocket rates)">
        <input type="number" min={1} value={weightGrams} onChange={(e) => setWeightGrams(e.target.value)} className={inputClass} />
      </Field>

      <Field label="Description">
        <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
      </Field>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isBestseller} onChange={(e) => setIsBestseller(e.target.checked)} />
          Bestseller
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
          New
        </label>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-text-dark/60">Images</p>
        {existingImages.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {existingImages.map((url) => (
              <div key={url} className="relative h-20 w-20 overflow-hidden rounded-card bg-ivory">
                <Image src={url} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setExistingImages((prev) => prev.filter((u) => u !== url))}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs shadow"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/heic,image/heif,.heic"
          multiple
          onChange={(e) => setNewFiles(Array.from(e.target.files ?? []))}
          className={inputClass}
        />
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-text-dark/60">Barcode Image</p>
        {existingBarcodeImage && !barcodeFile && (
          <div className="mb-3 flex items-center gap-3">
            <div className="relative h-20 w-20 overflow-hidden rounded-card border border-black/10 bg-ivory">
              <Image src={existingBarcodeImage} alt="" fill className="object-contain" />
            </div>
            <button
              type="button"
              onClick={() => setExistingBarcodeImage(null)}
              className="text-xs uppercase tracking-wide text-text-dark/50 underline"
            >
              Remove
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/heic,image/heif,.heic"
          onChange={(e) => setBarcodeFile(e.target.files?.[0] ?? null)}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-text-dark/40">Optional. One image — PNG stays uncompressed so scannability isn&apos;t affected.</p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={submitting} className="rounded-full bg-olive-dark px-6 py-2.5 text-sm uppercase tracking-wide text-ivory disabled:opacity-50">
          {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
        </button>
        {price && (
          <span className="text-xs text-text-dark/40">Preview: {formatPrice(Number(price) || 0)}</span>
        )}
      </div>
    </form>
  );
}

const inputClass = "w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-olive-dark";

// A dropdown over the admin-managed options for one heading. Two details
// matter here: "None" has to be selectable (these fields are optional, and a
// select with no empty entry would force the first option onto every
// product), and a product whose stored value isn't in the list any more still
// shows it — flagged, not silently rewritten to something else. That happens
// with data that predates the Attributes Manager, or if an option is renamed
// while a form sits open.
function AttributeField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const orphaned = value !== "" && !options.includes(value);

  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        <option value="">— None —</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        {orphaned && <option value={value}>{value} (not in Filter Attributes)</option>}
      </select>
      {options.length === 0 && !orphaned && (
        <p className="mt-1 text-xs text-amber-700">No options set up yet.</p>
      )}
    </Field>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-text-dark/60">{label}</label>
      {children}
    </div>
  );
}
