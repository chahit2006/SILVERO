"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", { redirect: false, email, password });
    setLoading(false);

    if (result?.error) {
      // Deliberately generic — SECURITY_CHECKLIST.md concern about not
      // leaking whether an email exists via the login endpoint.
      setError("Invalid email or password.");
      return;
    }

    router.push(searchParams.get("callbackUrl") ?? "/account");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-text-dark/60">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-olive-dark"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-text-dark/60">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-olive-dark"
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <Link href="/account/forgot-password" className="text-text-dark/60 underline">
          Forgot password?
        </Link>
        <Link href="/account/register" className="text-olive-dark underline">
          Create an account
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-olive-dark py-3 text-sm uppercase tracking-wide text-ivory disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
