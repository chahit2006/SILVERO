"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

// Two-stage login — email+password (step 1) issues an OTP by email and a
// short-lived mfaToken; the 6-digit code (step 2) is what actually signs in,
// via next-auth's credentials provider (lib/auth.ts). The mfaToken only ever
// lives in this component's state, never a cookie — it's not a session and
// isn't meant to survive a refresh.
type Stage = "credentials" | "otp";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<Stage>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/mfa/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok || !data?.mfaToken) {
      // Deliberately generic — SECURITY_CHECKLIST.md concern about not
      // leaking whether an email exists via the login endpoint.
      setError(data?.error ?? "Invalid email or password.");
      return;
    }

    setMfaToken(data.mfaToken);
    setStage("otp");
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", { redirect: false, mfaToken, otp });
    setLoading(false);

    if (result?.error) {
      setError("Incorrect or expired code.");
      return;
    }

    router.push(searchParams.get("callbackUrl") ?? "/account");
    router.refresh();
  }

  function backToCredentials() {
    setStage("credentials");
    setOtp("");
    setMfaToken("");
    setError(null);
  }

  if (stage === "otp") {
    return (
      <form onSubmit={handleOtpSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <p className="text-sm text-text-dark/60">
          Enter the 6-digit code sent to <span className="font-medium text-text-dark">{email}</span>. It
          expires in 5 minutes.
        </p>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-text-dark/60">Verification code</label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={6}
            pattern="\d{6}"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-center text-lg tracking-[0.5em] outline-none focus:border-olive-dark"
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <button type="button" onClick={backToCredentials} className="text-text-dark/60 underline">
            ‹ Back
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full rounded-full bg-olive-dark py-3 text-sm uppercase tracking-wide text-ivory disabled:opacity-50"
        >
          {loading ? "Verifying…" : "Verify & Sign In"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleCredentialsSubmit} className="space-y-4">
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
