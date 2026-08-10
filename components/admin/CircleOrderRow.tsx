"use client";

import Image from "next/image";
import { useState } from "react";
import type { CustomOrder, User } from "@prisma/client";
import { useRouter } from "next/navigation";

const STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "QUOTATION_SENT",
  "APPROVED",
  "IN_PRODUCTION",
  "QUALITY_CHECK",
  "READY",
  "SHIPPED",
] as const;

type Submission = CustomOrder & { user: Pick<User, "firstName" | "lastName" | "email"> };

export function CircleOrderRow({ submission }: { submission: Submission }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(submission.status);
  const [quotationDetails, setQuotationDetails] = useState(submission.quotationDetails ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/circle-orders/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, quotationDetails: quotationDetails || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error ?? "Couldn't save.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="border-b border-black/5 last:border-0">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between p-4 text-left text-sm">
        <div>
          <p className="font-medium">{submission.referenceNumber}</p>
          <p className="text-xs text-text-dark/50">
            {submission.user.firstName} {submission.user.lastName} · {submission.jewelleryType} ·{" "}
            {new Date(submission.createdAt).toLocaleDateString("en-IN")}
          </p>
        </div>
        <span className="rounded-full bg-ivory px-3 py-1 text-xs uppercase tracking-wide">{submission.status}</span>
      </button>

      {open && (
        <div className="space-y-3 px-4 pb-4">
          <p className="text-sm text-text-dark/70">{submission.description}</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-text-dark/60 sm:grid-cols-4">
            <p>Melting: {submission.melting}</p>
            <p>Budget: {submission.budgetRange}</p>
            <p>Timeline: {submission.timeline}</p>
            <p>Contact via: {submission.contactPreference}</p>
            {submission.sizing && <p>Sizing: {submission.sizing}</p>}
            {submission.netWeightGrams && <p>Weight: {submission.netWeightGrams}g</p>}
            <p>Email: {submission.user.email}</p>
          </div>

          {submission.photos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {submission.photos.map((url) => (
                <div key={url} className="relative h-16 w-16 overflow-hidden rounded-card bg-ivory">
                  <Image src={url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-xs text-red-700">{error}</p>}

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-text-dark/60">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="rounded-lg border border-black/15 px-3 py-2 text-sm">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[240px] flex-1">
              <label className="mb-1 block text-xs uppercase tracking-wide text-text-dark/60">Quotation details</label>
              <input
                value={quotationDetails}
                onChange={(e) => setQuotationDetails(e.target.value)}
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
              />
            </div>
            <button onClick={handleSave} disabled={saving} className="rounded-full bg-olive-dark px-5 py-2 text-xs uppercase tracking-wide text-ivory disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
