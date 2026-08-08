"use client";

import { useState } from "react";
import type { Address } from "@prisma/client";

type FormState = Omit<Address, "id" | "userId">;

const EMPTY_FORM: FormState = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  isDefault: false,
};

export function AddressBook({ initialAddresses }: { initialAddresses: Address[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/account/addresses");
    if (res.ok) setAddresses((await res.json()).addresses);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError("Couldn't save that address — check the PIN code.");
      return;
    }
    setForm(EMPTY_FORM);
    setFormOpen(false);
    await refresh();
  }

  async function handleDelete(id: string) {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    await fetch("/api/account/addresses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  return (
    <div>
      <div className="space-y-3">
        {addresses.map((addr) => (
          <div key={addr.id} className="rounded-card border border-black/10 p-4 text-sm">
            <div className="flex items-start justify-between">
              <div>
                <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                <p className="text-text-dark/60">
                  {addr.city}, {addr.state} {addr.pincode}
                </p>
                {addr.isDefault && (
                  <span className="mt-1 inline-block rounded-full bg-ivory px-2 py-0.5 text-[10px] uppercase tracking-wide">
                    Default
                  </span>
                )}
              </div>
              <button onClick={() => handleDelete(addr.id)} className="text-xs text-text-dark/40 underline">
                Remove
              </button>
            </div>
          </div>
        ))}
        {addresses.length === 0 && !formOpen && (
          <p className="rounded-card border border-dashed border-black/15 p-8 text-center text-sm text-text-dark/60">
            No saved addresses yet.
          </p>
        )}
      </div>

      {formOpen ? (
        <form onSubmit={handleSubmit} className="mt-4 max-w-md space-y-3 rounded-card border border-black/10 p-4">
          {error && <p className="text-sm text-red-700">{error}</p>}
          <input
            required
            placeholder="Address line 1"
            value={form.line1}
            onChange={(e) => setForm({ ...form, line1: e.target.value })}
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
          <input
            placeholder="Address line 2 (optional)"
            value={form.line2 ?? ""}
            onChange={(e) => setForm({ ...form, line2: e.target.value })}
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </div>
          <input
            required
            placeholder="PIN code"
            pattern="\d{6}"
            title="6-digit PIN code"
            value={form.pincode}
            onChange={(e) => setForm({ ...form, pincode: e.target.value })}
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
            />
            Set as default
          </label>
          <div className="flex gap-2">
            <button type="submit" className="rounded-full bg-olive-dark px-5 py-2 text-xs uppercase tracking-wide text-ivory">
              Save Address
            </button>
            <button type="button" onClick={() => setFormOpen(false)} className="text-xs uppercase tracking-wide text-text-dark/50">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setFormOpen(true)}
          className="mt-4 rounded-full border border-olive-dark px-5 py-2 text-xs uppercase tracking-wide text-olive-dark"
        >
          Add New Address
        </button>
      )}
    </div>
  );
}
