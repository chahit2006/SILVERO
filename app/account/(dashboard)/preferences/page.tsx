import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// UI shell — DATA_MODEL.md's User model has no marketing-consent/notification
// fields to back this yet. Flagged for a schema addition once the client
// confirms what preferences are actually needed (email/SMS opt-in, etc.).
export default async function PreferencesPage() {
  const user = await requireUser();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Preferences</h1>
      <div className="max-w-md space-y-4 rounded-card border border-black/10 p-6">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-text-dark/60">Email</label>
          <input disabled value={user.email ?? ""} className="w-full rounded-lg border border-black/15 bg-ivory px-3 py-2 text-sm text-text-dark/60" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked disabled />
          Email me about new arrivals and offers
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled />
          SMS/WhatsApp updates on my orders
        </label>
        <p className="text-xs text-text-dark/40">Not wired up yet — not persisted server-side.</p>
      </div>
    </div>
  );
}
