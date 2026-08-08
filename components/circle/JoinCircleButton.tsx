"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatPrice } from "@/lib/format";

declare global {
  interface Window {
    Cashfree?: (config: { mode: "sandbox" | "production" }) => {
      checkout: (opts: { paymentSessionId: string; redirectTarget?: string }) => void;
    };
  }
}

function loadCashfreeSdk(): Promise<ReturnType<NonNullable<Window["Cashfree"]>>> {
  return new Promise((resolve, reject) => {
    if (window.Cashfree) {
      resolve(window.Cashfree({ mode: process.env.NODE_ENV === "production" ? "production" : "sandbox" }));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.onload = () => {
      if (!window.Cashfree) return reject(new Error("Cashfree SDK failed to load."));
      resolve(window.Cashfree({ mode: process.env.NODE_ENV === "production" ? "production" : "sandbox" }));
    };
    script.onerror = () => reject(new Error("Cashfree SDK failed to load."));
    document.body.appendChild(script);
  });
}

// See lib/circle.ts for the CIRCLE_JOIN_FEE placeholder caveat and
// lib/cashfree.ts for the "unverified against a live account" caveat.
export function JoinCircleButton({ circleJoinFee }: { circleJoinFee: number }) {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    if (status !== "authenticated") {
      router.push("/account/login?callbackUrl=/circle");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/circle/join", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Couldn't process that. Please try again.");

      if (data.qualifiedVia === "PURCHASE") {
        router.push("/account/circle");
        router.refresh();
        return;
      }

      if (data.requiresPayment) {
        const cashfree = await loadCashfreeSdk();
        cashfree.checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: "_self" });
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      <button
        onClick={handleJoin}
        disabled={loading}
        className="rounded-full bg-olive-dark px-8 py-3.5 text-sm uppercase tracking-wide text-ivory disabled:opacity-50"
      >
        {loading ? "Just a moment…" : "Join SILVERO Circle"}
      </button>
      <p className="mt-2 text-xs text-text-dark/50">
        Free if you&apos;ve purchased before — otherwise {formatPrice(circleJoinFee)} to join.
      </p>
    </div>
  );
}
