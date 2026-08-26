"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// DESIGN_SYSTEM.md §5 #11 — split section, decorative left, olive CTA right,
// email capture. Circle membership itself is real now (/circle) — this
// section stays an email-capture teaser per spec, with a link through to
// the actual join page rather than only the newsletter-style form.
export function CircleCTA() {
  const [status, setStatus] = useState<"idle" | "submitted">("idle");

  return (
    <section className="grid grid-cols-1 md:grid-cols-2">
      <div className="relative min-h-[280px]">
        <Image src="/placeholders/silvero-cta.png" alt="" fill className="object-cover" />
      </div>
      <div className="flex flex-col justify-center bg-olive-dark px-8 py-16 text-ivory sm:px-16">
        <p className="text-xs uppercase tracking-[0.2em] opacity-70">SILVERO Circle</p>
        <h2 className="mt-3 max-w-sm font-display text-3xl">Join the Circle for early access and rewards</h2>
        <p className="mt-3 max-w-sm text-sm opacity-80">
          Members get first access to new drops, a custom one-of-one order line, and loyalty points on
          every purchase.
        </p>

        {status === "submitted" ? (
          <p className="mt-6 text-sm">Thanks — we&apos;ll be in touch.</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStatus("submitted");
            }}
            className="mt-6 flex max-w-sm overflow-hidden rounded-card border border-ivory/25"
          >
            <input
              type="email"
              required
              placeholder="Email address"
              className="w-full bg-transparent px-4 py-2.5 text-sm text-ivory placeholder:text-ivory/50 outline-none"
            />
            <button
              type="submit"
              className="shrink-0 bg-ivory px-5 text-xs uppercase tracking-wide text-olive-dark"
            >
              Notify Me
            </button>
          </form>
        )}

        <Link href="/circle" className="mt-4 inline-block text-xs uppercase tracking-wide underline opacity-80">
          Learn more &amp; join
        </Link>
      </div>
    </section>
  );
}
