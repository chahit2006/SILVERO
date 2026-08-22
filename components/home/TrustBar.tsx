const ITEMS = [
  { label: "Complimentary Shipping", detail: "Across India, on every order" },
  { label: "925 Sterling Silver", detail: "Hallmarked, always" },
  { label: "Lifetime Plating", detail: "Free re-plating for life" },
];

// DESIGN_SYSTEM.md §5 #2 (simple row) and #10 (detailed, rounded icon
// containers) — same content, `detailed` toggles the presentation.
export function TrustBar({ detailed = false }: { detailed?: boolean }) {
  return (
    <section className="bg-white py-10">
      <div
        className={`mx-auto grid max-w-screen-2xl grid-cols-2 gap-6 px-4 lg:grid-cols-4 lg:px-8 ${
          detailed ? "" : "text-center"
        }`}
      >
        {ITEMS.map((item) => (
          <div
            key={item.label}
            className={detailed ? "flex items-start gap-3" : "flex flex-col items-center gap-1"}
          >
            {detailed && (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ivory">
                <span className="h-2 w-2 rounded-full bg-olive-dark" />
              </span>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-dark sm:text-sm">
                {item.label}
              </p>
              {detailed && <p className="mt-0.5 text-xs text-text-dark/50">{item.detail}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
