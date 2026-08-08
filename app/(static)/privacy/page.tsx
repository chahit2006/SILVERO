import { StaticPage } from "@/components/static/StaticPage";

// ⚠️ Placeholder legal text — NOT reviewed by counsel. India's DPDP Act 2023
// has specific consent/notice requirements; get this reviewed before launch,
// don't ship as-is. Flagged visibly on the page itself, not just in code,
// since legal pages are easy to accidentally publish unreviewed.
export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy" updated="Draft — pending legal review">
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800">
        This is placeholder text, not a reviewed legal document. Do not publish live without legal
        sign-off, including compliance with India&apos;s Digital Personal Data Protection Act, 2023.
      </p>

      <h2>What we collect</h2>
      <p>
        Account details (name, email, phone), shipping addresses, order history, and — for Circle
        Custom Order submissions — photos you upload. We use cookies for cart persistence and site
        analytics.
      </p>

      <h2>How we use it</h2>
      <ul>
        <li>To process and ship your orders</li>
        <li>To manage your account, wishlist, and Circle membership</li>
        <li>To send order updates and, if opted in, marketing communications</li>
      </ul>

      <h2>Third parties</h2>
      <p>
        We share order and shipping details with Cashfree (payments) and Shiprocket (logistics) only
        as needed to fulfil your order.
      </p>

      <h2>Your rights</h2>
      <p>
        You can request access to, correction of, or deletion of your personal data by contacting us
        via the <a href="/contact">Contact page</a>.
      </p>
    </StaticPage>
  );
}
