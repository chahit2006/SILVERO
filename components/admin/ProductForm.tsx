"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category, Product } from "@prisma/client";
import { formatPrice } from "@/lib/format";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ADMIN_PANEL_SPEC.md §3 — one shared form for both /admin/products/new and
// /admin/products/[id]/edit.
export function ProductForm({ categories, product }: { categories: Category[]; product?: Product }) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit); // don't auto-overwrite an existing slug
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [stock, setStock] = useState(product?.stock?.toString() ?? "0");
  const [material, setMaterial] = useState(product?.material ?? "");
  const [stone, setStone] = useState(product?.stone ?? "");
  const [occasion, setOccasion] = useState(product?.occasion ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [sizeOptions, setSizeOptions] = useState(product?.sizeOptions?.join(", ") ?? "");
  const [weightGrams, setWeightGrams] = useState(product?.weightGrams?.toString() ?? "");
  const [isBestseller, setIsBestseller] = useState(product?.isBestseller ?? false);
  const [isNew, setIsNew] = useState(product?.isNew ?? false);
  const [existingImages, setExistingImages] = useState<string[]>(product?.images ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
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
    formData.set("categoryId", categoryId);
    formData.set("price", price);
    formData.set("stock", stock);
    if (material) formData.set("material", material);
    if (stone) formData.set("stone", stone);
    if (occasion) formData.set("occasion", occasion);
    if (description) formData.set("description", description);
    formData.set("sizeOptions", sizeOptions);
    if (weightGrams) formData.set("weightGrams", weightGrams);
    formData.set("isBestseller", String(isBestseller));
    formData.set("isNew", String(isNew));
    if (isEdit) formData.set("existingImages", JSON.stringify(existingImages));
    newFiles.forEach((f) => formData.append("images", f));

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
        <Field label="Stock">
          <input required type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Material">
          <input value={material} onChange={(e) => setMaterial(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Stone">
          <input value={stone} onChange={(e) => setStone(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Occasion">
          <input value={occasion} onChange={(e) => setOccasion(e.target.value)} className={inputClass} />
        </Field>
      </div>

      <Field label="Size options (comma-separated, optional)">
        <input value={sizeOptions} onChange={(e) => setSizeOptions(e.target.value)} placeholder="10, 12, 14, 16" className={inputClass} />
      </Field>

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-text-dark/60">{label}</label>
      {children}
    </div>
  );
}
