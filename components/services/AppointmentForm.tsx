"use client";

import { useState } from "react";
import { STORES } from "@/lib/stores";

const SERVICES = ["Styling Consultation", "Engraving", "Try-On"] as const;

// FEATURE_SPEC_BATCH2.md §4 "Book Appointment" — name, contact, preferred
// date/time, nearest store; confirmation shows the store address and time.
export function AppointmentForm() {
  const [form, setForm] = useState({
    guestName: "",
    guestContact: "",
    service: SERVICES[0] as string,
    date: "",
    storeId: STORES[0].id,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ store: (typeof STORES)[number]; date: string } | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, date: new Date(form.date).toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");
      setConfirmed({ store: data.store, date: form.date });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <div className="rounded-card bg-ivory p-6">
        <p className="font-display text-xl">Appointment confirmed</p>
        <p className="mt-2 text-sm text-text-dark/70">
          {new Date(confirmed.date).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}
        </p>
        <p className="mt-1 text-sm text-text-dark/70">
          {confirmed.store.name}
          <br />
          {confirmed.store.address}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <Field label="Name">
        <input required value={form.guestName} onChange={(e) => update("guestName", e.target.value)} className={inputClass} />
      </Field>
      <Field label="Phone or email">
        <input required value={form.guestContact} onChange={(e) => update("guestContact", e.target.value)} className={inputClass} />
      </Field>
      <Field label="Service">
        <select value={form.service} onChange={(e) => update("service", e.target.value)} className={inputClass}>
          {SERVICES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label="Preferred date & time">
        <input required type="datetime-local" value={form.date} onChange={(e) => update("date", e.target.value)} className={inputClass} />
      </Field>
      <Field label="Nearest store">
        <select value={form.storeId} onChange={(e) => update("storeId", e.target.value)} className={inputClass}>
          {STORES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>

      <button type="submit" disabled={submitting} className="rounded-full bg-olive-dark px-6 py-2.5 text-sm uppercase tracking-wide text-ivory disabled:opacity-50">
        {submitting ? "Booking…" : "Book Appointment"}
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
