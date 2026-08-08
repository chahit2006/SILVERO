import { StaticPage } from "@/components/static/StaticPage";

export default function ShippingPage() {
  return (
    <StaticPage title="Shipping Information">
      <h2>Delivery options</h2>
      <ul>
        <li>Standard — complimentary, 5–7 business days</li>
        <li>Express — paid, 2–3 business days</li>
      </ul>

      <h2>Coverage</h2>
      <p>We ship across India. Shipment tracking becomes available once your order has shipped.</p>

      <h2>Order processing</h2>
      <p>Orders are processed within 1–2 business days of payment confirmation, then handed off for delivery.</p>
    </StaticPage>
  );
}
