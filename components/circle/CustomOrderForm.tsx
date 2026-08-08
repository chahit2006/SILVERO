"use client";

import { useState } from "react";

const JEWELLERY_TYPES = ["Ring", "Chain", "Bracelet", "Kada", "Pendant", "Other"];
const MELTING_OPTIONS = ["925 Sterling Silver", "925 Sterling Silver, Gold-Plated"];
const BUDGET_RANGES = ["Under ₹5,000", "₹5,000 – 15,000", "₹15,000 – 30,000", "₹30,000+"];
const TIMELINES = ["No rush", "Within 1 month", "2–3 weeks", "Urgent (contact us)"];
const CONTACT_PREFERENCES = ["Phone", "WhatsApp", "Email"] as const;

const SIZING_LABEL: Record<string, string> = {
  Ring: "Ring size",
  Chain: "Chain length",
  Bracelet: "Wrist size",
  Kada: "Kada size",
  Pendant: "Chain length (if attached)",
  Other: "Sizing notes",
};

// PRD.md §4 "Custom Order (One-of-One)" — SECURITY_CHECKLIST.md §4 governs
// the photo handling on the server side (app/api/circle/custom-order); this
// form just needs to send real files via FormData, not JSON.
export function CustomOrderForm() {
  const [jewelleryType, setJewelleryType] = useState(JEWELLERY_TYPES[0]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ referenceNumber: string } | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 5) {
      setError("Choose at most 5 photos.");
      return;
    }
    setError(null);
    setPhotos(files);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (photos.length === 0) {
      setError("Upload at least one photo.");
      return;
    }

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    photos.forEach((file) => formData.append("photos", file));

    try {
      const res = await fetch("/api/circle/custom-order", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");
      setResult({ referenceNumber: data.referenceNumber });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-card bg-ivory p-6 text-center">
        <p className="font-display text-xl">Submitted — thank you</p>
        <p className="mt-2 text-sm text-text-dark/60">
          Your reference number is <span className="font-medium text-text-dark">{result.referenceNumber}</span>.
        </p>
        <p className="mt-1 text-xs text-text-dark/40">
          Save this — email confirmation isn&apos;t wired up yet, this page is the record for now.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <Field label="Jewellery type">
        <select
          name="jewelleryType"
          value={jewelleryType}
          onChange={(e) => setJewelleryType(e.target.value)}
          className={inputClass}
        >
          {JEWELLERY_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>

      <Field label="Describe what you have in mind">
        <textarea name="description" required maxLength={2000} rows={4} className={inputClass} />
      </Field>

      <Field label={SIZING_LABEL[jewelleryType]}>
        <input name="sizing" maxLength={200} className={inputClass} />
      </Field>

      <Field label="Approximate weight, in grams (optional)">
        <input name="netWeightGrams" type="number" min={1} max={2000} className={inputClass} />
      </Field>

      <Field label="Melting type">
        <select name="melting" className={inputClass}>
          {MELTING_OPTIONS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </Field>

      <Field label="Budget range">
        <select name="budgetRange" className={inputClass}>
          {BUDGET_RANGES.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </Field>

      <Field label="Timeline">
        <select name="timeline" className={inputClass}>
          {TIMELINES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>

      <Field label="Preferred contact method">
        <select name="contactPreference" className={inputClass}>
          {CONTACT_PREFERENCES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>

      <Field label="Reference photos (up to 5 — JPG, PNG, or HEIC)">
        <input
          type="file"
          accept="image/jpeg,image/png,image/heic,image/heif,.heic"
          multiple
          onChange={handlePhotoChange}
          className={inputClass}
        />
        {photos.length > 0 && <p className="mt-1 text-xs text-text-dark/50">{photos.length} photo(s) selected</p>}
      </Field>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-olive-dark px-6 py-2.5 text-sm uppercase tracking-wide text-ivory disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit Request"}
      </button>
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
