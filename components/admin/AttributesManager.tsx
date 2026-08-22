"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { HeadingWithOptions } from "@/lib/attributes";

// FILTER_SPEC_IMPLEMENTATION.md Part 1 — CRUD + reorder over the options
// inside each fixed heading. Reordering is native HTML5 drag-and-drop plus
// up/down buttons: the buttons are the real control for keyboard and touch
// (HTML5 drag does not fire on touch at all), and CLAUDE.md #1 rules out
// pulling in a drag library for it.
export function AttributesManager({ headings }: { headings: HeadingWithOptions[] }) {
  return (
    <div className="space-y-4">
      {headings.map((heading) => (
        <HeadingCard key={heading.key} heading={heading} />
      ))}
    </div>
  );
}

function HeadingCard({ heading }: { heading: HeadingWithOptions }) {
  const router = useRouter();
  // Local copy so a drag/reorder repaints instantly; the server stays the
  // source of truth and router.refresh() re-syncs after every mutation.
  const [options, setOptions] = useState(heading.options);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Keeps the optimistic list in step when the server sends fresh props
  // (after router.refresh()), without reaching for an effect.
  const [lastProps, setLastProps] = useState(heading.options);
  if (lastProps !== heading.options) {
    setLastProps(heading.options);
    setOptions(heading.options);
  }

  async function call(url: string, init: RequestInit) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function addOption(e: React.FormEvent) {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    const ok = await call("/api/admin/attributes/options", {
      method: "POST",
      body: JSON.stringify({ headingKey: heading.key, label }),
    });
    if (ok) setNewLabel("");
  }

  async function saveRename(id: string) {
    const label = editLabel.trim();
    if (!label) return;
    const ok = await call(`/api/admin/attributes/options/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ label }),
    });
    if (ok) setEditingId(null);
  }

  async function deleteOption(option: HeadingWithOptions["options"][number]) {
    // The API refuses this outright when products still carry the label — say
    // so before the click rather than after the error comes back.
    const message =
      option.productCount > 0
        ? `${option.label} is tagged on ${option.productCount} product(s). Retag those products first — deleting will be refused. Continue anyway?`
        : `Delete ${option.label}?`;
    if (!confirm(message)) return;
    await call(`/api/admin/attributes/options/${option.id}`, { method: "DELETE" });
  }

  async function commitOrder(next: typeof options) {
    setOptions(next);
    await call(`/api/admin/attributes/${heading.key}/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ optionIds: next.map((o) => o.id) }),
    });
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= options.length) return;
    const next = [...options];
    [next[index], next[target]] = [next[target], next[index]];
    void commitOrder(next);
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const from = options.findIndex((o) => o.id === dragId);
    const to = options.findIndex((o) => o.id === targetId);
    setDragId(null);
    if (from < 0 || to < 0) return;
    const next = [...options];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    void commitOrder(next);
  }

  return (
    <section className="rounded-card border border-black/10">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-black/10 bg-ivory px-4 py-3">
        <h3 className="text-sm font-medium">
          {heading.label}
          <span className="ml-2 text-xs font-normal text-text-dark/40">{heading.key}</span>
        </h3>
        <span className="text-xs text-text-dark/50">
          {options.length} option{options.length === 1 ? "" : "s"}
        </span>
      </header>

      <div className="p-4">
        {heading.note && <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{heading.note}</p>}
        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {options.length === 0 ? (
          <p className="mb-3 text-sm text-text-dark/40">No options yet.</p>
        ) : (
          <ul className="mb-4 divide-y divide-black/5">
            {options.map((option, i) => (
              <li
                key={option.id}
                draggable={editingId !== option.id}
                onDragStart={() => setDragId(option.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(option.id)}
                onDragEnd={() => setDragId(null)}
                className={`flex flex-wrap items-center gap-2 py-2 ${dragId === option.id ? "opacity-40" : ""}`}
              >
                <span className="cursor-grab select-none px-1 text-text-dark/30" aria-hidden>
                  ⠿
                </span>

                {editingId === option.id ? (
                  <>
                    <input
                      autoFocus
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void saveRename(option.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      maxLength={120}
                      className="min-w-0 flex-1 rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:border-olive-dark"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void saveRename(option.id)}
                      className="text-xs uppercase tracking-wide text-olive-dark underline disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-xs uppercase tracking-wide text-text-dark/50 underline"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 text-sm">{option.label}</span>
                    <span
                      className={`shrink-0 text-xs ${option.productCount > 0 ? "text-text-dark/50" : "text-text-dark/30"}`}
                      title={
                        heading.field
                          ? option.productCount > 0
                            ? "Live products tagged with this option — it shows in the shop filters."
                            : "No live product uses this yet, so it stays hidden in the shop filters."
                          : "This heading has no product field yet (Part 2)."
                      }
                    >
                      {heading.field ? `${option.productCount} product${option.productCount === 1 ? "" : "s"}` : "—"}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <OrderButton label="Move up" disabled={busy || i === 0} onClick={() => move(i, -1)}>
                        ↑
                      </OrderButton>
                      <OrderButton label="Move down" disabled={busy || i === options.length - 1} onClick={() => move(i, 1)}>
                        ↓
                      </OrderButton>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(option.id);
                        setEditLabel(option.label);
                      }}
                      className="text-xs uppercase tracking-wide text-text-dark/60 underline"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void deleteOption(option)}
                      className="text-xs uppercase tracking-wide text-red-700/70 underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addOption} className="flex gap-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder={`Add an option to ${heading.label}`}
            maxLength={120}
            className="min-w-0 flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-olive-dark"
          />
          <button
            type="submit"
            disabled={busy || !newLabel.trim()}
            className="shrink-0 rounded-full bg-olive-dark px-5 py-2 text-xs uppercase tracking-wide text-ivory disabled:opacity-50"
          >
            Add
          </button>
        </form>
      </div>
    </section>
  );
}

function OrderButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded border border-black/10 px-1.5 py-0.5 text-xs leading-none text-text-dark/60 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
