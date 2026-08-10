// DESIGN_SYSTEM.md §4 "Header / Navigation" — announcement bar above nav.
const MESSAGE =
  "COMPLIMENTARY SHIPPING ACROSS INDIA | 925 STERLING SILVER | LIFETIME PLATING";

export function AnnouncementBar() {
  return (
    <div className="bg-olive-dark text-ivory text-[11px] sm:text-xs tracking-wide">
      <p className="mx-auto max-w-screen-2xl overflow-hidden whitespace-nowrap px-4 py-2 text-center">
        {MESSAGE}
      </p>
    </div>
  );
}
