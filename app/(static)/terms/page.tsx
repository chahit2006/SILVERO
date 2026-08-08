import { StaticPage } from "@/components/static/StaticPage";

// ⚠️ Placeholder legal text — see privacy/page.tsx note. Not reviewed by counsel.
export default function TermsPage() {
  return (
    <StaticPage title="Terms of Service" updated="Draft — pending legal review">
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800">
        This is placeholder text, not a reviewed legal document. Do not publish live without legal
        sign-off.
      </p>

      <h2>Orders</h2>
      <p>
        Placing an order is an offer to purchase, which we accept when payment is confirmed. We
        reserve the right to cancel orders in cases of pricing errors or stock unavailability.
      </p>

      <h2>Pricing</h2>
      <p>All prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise.</p>

      <h2>Product accuracy</h2>
      <p>
        We make every effort to display products accurately. Minor variations in handcrafted pieces
        (weight, finish) are normal and not defects.
      </p>

      <h2>SILVERO Circle</h2>
      <p>Circle membership terms, including qualification and benefits, are governed by the Circle program terms shown at sign-up.</p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India.</p>
    </StaticPage>
  );
}
