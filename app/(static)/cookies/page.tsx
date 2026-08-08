import { StaticPage } from "@/components/static/StaticPage";

// ⚠️ Placeholder legal text — see privacy/page.tsx note. Not reviewed by counsel.
export default function CookiesPage() {
  return (
    <StaticPage title="Cookie Policy" updated="Draft — pending legal review">
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800">
        This is placeholder text, not a reviewed legal document. Do not publish live without legal
        sign-off.
      </p>

      <h2>Essential cookies</h2>
      <p>
        Used for cart persistence (guest checkout), session/login, and security — the site can&apos;t
        function correctly without these.
      </p>

      <h2>Analytics cookies</h2>
      <p>Help us understand site usage so we can improve it. You can opt out via the cookie banner.</p>

      <h2>Managing preferences</h2>
      <p>
        Use the &ldquo;Manage preferences&rdquo; option on the cookie banner, or clear cookies in your
        browser settings at any time.
      </p>
    </StaticPage>
  );
}
