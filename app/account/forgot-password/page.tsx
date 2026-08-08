"use client";

import { useState } from "react";

// UI shell only — not wired to a real backend yet. DATA_MODEL.md has no
// password-reset-token model, and TECH_STACK.md doesn't name a transactional
// email provider (free-tools-only constraint means this needs a deliberate
// choice — e.g. Resend/Brevo free tier — rather than being invented here).
// Flagged for the team to pick a provider before wiring this up for real.
export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <h1 className="mb-3 font-display text-2xl">Reset Password</h1>
      <p className="mb-6 text-sm text-text-dark/60">
        Enter the email on your account and we&apos;ll send a link to reset your password.
      </p>

      {submitted ? (
        <p className="rounded-lg bg-ivory px-4 py-3 text-sm">
          If an account exists for that email, a reset link is on its way.
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="space-y-4"
        >
          <input
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-olive-dark"
          />
          <button
            type="submit"
            className="w-full rounded-full bg-olive-dark py-3 text-sm uppercase tracking-wide text-ivory"
          >
            Send Reset Link
          </button>
        </form>
      )}
    </div>
  );
}
