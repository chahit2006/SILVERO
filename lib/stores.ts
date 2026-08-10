// FEATURE_SPEC_BATCH2.md §4 "Book Appointment" needs a "nearest store"
// picker, but Store Locator/Store Detail pages are explicitly out of scope
// (PRD.md §1 "Confirmed Out of Scope"). This is the minimum needed to make
// the appointment form work without building that — a flat, hardcoded list,
// no map, no per-store detail pages. Placeholder addresses; swap for the
// client's real store locations before launch.
export type Store = { id: string; name: string; address: string };

export const STORES: Store[] = [
  { id: "mumbai-bandra", name: "Mumbai — Bandra", address: "Hill Road, Bandra West, Mumbai, Maharashtra 400050" },
  { id: "delhi-gk", name: "Delhi — Greater Kailash", address: "M Block Market, Greater Kailash 1, New Delhi 110048" },
  { id: "bengaluru-indiranagar", name: "Bengaluru — Indiranagar", address: "100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038" },
];

export function getStore(id: string): Store | undefined {
  return STORES.find((s) => s.id === id);
}
