"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Shared by the engraving-requests and returns queues — both are "list of
// requests, each with a status dropdown that PATCHes on change," just
// against different endpoints/status lists.
export function AdminStatusSelect({
  endpoint,
  currentStatus,
  options,
}: {
  endpoint: string;
  currentStatus: string;
  options: readonly string[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: string) {
    setStatus(next);
    setSaving(true);
    try {
      await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={saving}
      className="rounded-full border border-black/15 px-3 py-1 text-xs uppercase tracking-wide disabled:opacity-50"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}
