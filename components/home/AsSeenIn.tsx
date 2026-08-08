// DESIGN_SYSTEM.md §5 #9 — press logo strip, low opacity.
// ⚠️ Placeholder wordmarks only — these are NOT confirmed real press
// mentions. Don't ship to production until the client confirms which (if
// any) of these outlets have actually featured SILVERO.925 — displaying
// unverified press names is a false-advertising risk.
const OUTLETS = ["Vogue", "Elle", "Grazia", "Bazaar", "Femina"];

export function AsSeenIn() {
  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-screen-2xl px-4 lg:px-8">
        <p className="mb-6 text-center text-xs uppercase tracking-wide text-text-dark/40">As Seen In</p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {OUTLETS.map((name) => (
            <span key={name} className="font-display text-lg text-text-dark/30 sm:text-xl">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
