import Link from "next/link";
import { StaticPage } from "@/components/static/StaticPage";

// Public policy page — distinct from the logged-in /account/returns flow
// where an actual return request is filed.
export default function ReturnsPolicyPage() {
  return (
    <StaticPage title="Returns & Exchanges">
      <h2>7-day returns</h2>
      <p>
        Unworn items in original packaging can be returned within 7 days of delivery for a refund or
        exchange.
      </p>

      <h2>What&apos;s not eligible</h2>
      <ul>
        <li>Custom Order (one-of-one) pieces</li>
        <li>Engraved items</li>
        <li>Items showing signs of wear</li>
      </ul>

      <h2>How to start a return</h2>
      <p>
        If you have an account, start a return from{" "}
        <Link href="/account/returns/new">your order history</Link>. Refunds are issued to your original
        payment method once the returned item is received and inspected.
      </p>
    </StaticPage>
  );
}
