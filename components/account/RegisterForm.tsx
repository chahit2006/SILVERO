"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
    });
    setLoading(false);

    if (result?.error) {
      // Account was created but auto sign-in failed — send them to login instead.
      router.push("/account/login");
      return;
    }

    router.push("/account");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <Field label="First name">
          <input
            required
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-olive-dark"
          />
        </Field>
        <Field label="Last name">
          <input
            required
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-olive-dark"
          />
        </Field>
      </div>

      <Field label="Email">
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-olive-dark"
        />
      </Field>

      <Field label="Phone (optional)">
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-olive-dark"
        />
      </Field>

      <Field label="Password (min. 8 characters)">
        <input
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-olive-dark"
        />
      </Field>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-olive-dark py-3 text-sm uppercase tracking-wide text-ivory disabled:opacity-50"
      >
        {loading ? "Creating account…" : "Create Account"}
      </button>
    </form>
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
