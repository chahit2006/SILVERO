import { GiftCardForm } from "@/components/gifting/GiftCardForm";

export default function GiftCardsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 lg:px-8">
      <h1 className="font-display text-3xl">Gift Cards</h1>
      <p className="mt-3 mb-10 text-sm text-text-dark/60">
        Digital, delivered instantly (or scheduled) — or a physical card, shipped.
      </p>
      <GiftCardForm />
    </div>
  );
}
