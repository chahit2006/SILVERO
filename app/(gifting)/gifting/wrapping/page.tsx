const OPTIONS = [
  { name: "Signature", desc: "Our everyday wrap — kraft box, ivory ribbon.", price: "Complimentary" },
  { name: "Premium", desc: "Rigid gift box, olive ribbon, a handwritten note card.", price: "₹149" },
];

// Gift wrap itself is selected per-item in the cart drawer (CartItem.giftWrap)
// — this is the informational/marketing page for those same two options.
export default function WrappingPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 lg:px-8">
      <h1 className="font-display text-3xl">Gift Wrapping</h1>
      <p className="mt-3 text-sm text-text-dark/60">Choose a wrap style for any item at checkout.</p>

      <div className="mt-10 space-y-4">
        {OPTIONS.map((opt) => (
          <div key={opt.name} className="rounded-card border border-black/10 p-5">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg">{opt.name}</p>
              <p className="text-sm text-text-dark/60">{opt.price}</p>
            </div>
            <p className="mt-1 text-sm text-text-dark/60">{opt.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
