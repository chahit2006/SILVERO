"use client";

import { useState } from "react";
import Link from "next/link";
import type { Registry } from "@prisma/client";
import { RegistryBuilder } from "./RegistryBuilder";

export function RegistryPageClient({ existingRegistries }: { existingRegistries: Registry[] }) {
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(existingRegistries.length === 0);

  if (createdSlug) {
    return (
      <div className="rounded-card bg-ivory p-6">
        <p className="font-display text-lg">Registry created</p>
        <p className="mt-2 text-sm text-text-dark/60">Share this link with your guests:</p>
        <p className="mt-2 break-all rounded-lg bg-white p-3 text-sm">
          {typeof window !== "undefined" ? window.location.origin : ""}/gifting/registry/{createdSlug}
        </p>
        <Link href={`/gifting/registry/${createdSlug}`} className="mt-3 inline-block text-xs uppercase tracking-wide text-olive-dark underline">
          View it
        </Link>
      </div>
    );
  }

  return (
    <div>
      {existingRegistries.length > 0 && (
        <div className="mb-8">
          <p className="mb-3 text-xs uppercase tracking-wide text-text-dark/50">Your registries</p>
          <ul className="divide-y divide-black/10 rounded-card border border-black/10">
            {existingRegistries.map((r) => (
              <li key={r.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-text-dark/50">{r.occasion}</p>
                </div>
                <Link href={`/gifting/registry/${r.shareSlug}`} className="text-xs uppercase tracking-wide text-olive-dark underline">
                  View share link
                </Link>
              </li>
            ))}
          </ul>
          {!showBuilder && (
            <button onClick={() => setShowBuilder(true)} className="mt-4 rounded-full border border-olive-dark px-5 py-2 text-xs uppercase tracking-wide text-olive-dark">
              Create another registry
            </button>
          )}
        </div>
      )}

      {showBuilder && <RegistryBuilder onCreated={setCreatedSlug} />}
    </div>
  );
}
