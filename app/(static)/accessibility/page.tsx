import { StaticPage } from "@/components/static/StaticPage";

export default function AccessibilityPage() {
  return (
    <StaticPage title="Accessibility">
      <p>
        We want SILVERO.925 to be usable by everyone. The site is built with semantic HTML, keyboard
        navigation, and respects your device&apos;s reduced-motion setting.
      </p>

      <h2>Ongoing work</h2>
      <p>
        Accessibility is an ongoing effort, not a one-time checklist. If you run into an issue using
        the site with assistive technology, please let us know via the{" "}
        <a href="/contact">Contact page</a> — we take these reports seriously.
      </p>
    </StaticPage>
  );
}
