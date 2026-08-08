"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * While an order is still PENDING (Cashfree redirected back before the
 * webhook landed — a normal race, not a bug), periodically re-fetches the
 * server component so the page updates itself once /api/cashfree/webhook
 * marks it PAID/CANCELLED. Stops after ~1 minute — at that point something's
 * actually wrong, not just a slow webhook.
 */
export function PendingPoller({ isPending }: { isPending: boolean }) {
  const router = useRouter();
  const attempts = useRef(0);

  useEffect(() => {
    if (!isPending) return;

    const interval = setInterval(() => {
      attempts.current += 1;
      if (attempts.current > 12) {
        clearInterval(interval);
        return;
      }
      router.refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPending, router]);

  return null;
}
