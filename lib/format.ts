const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

// Prices are stored as whole rupees (DATA_MODEL.md "Notes" — money as integers).
export function formatPrice(rupees: number): string {
  return inr.format(rupees);
}
