import Image from "next/image";
import type { CartItemWithProduct } from "@/components/providers/CartProvider";
import { formatPrice } from "@/lib/format";

export function OrderSummary({
  items,
  subtotal,
  shipping,
}: {
  items: CartItemWithProduct[];
  subtotal: number;
  shipping: number | null; // null = not yet known (pincode not entered)
}) {
  return (
    <div className="rounded-card border border-black/10 p-5">
      <p className="mb-4 font-display text-lg">Order Summary</p>

      <ul className="mb-4 space-y-3 divide-y divide-black/5">
        {items.map((item) => (
          <li key={item.id} className="flex gap-3 pt-3 first:pt-0">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-card bg-ivory">
              {item.product.images[0] && (
                <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
              )}
            </div>
            <div className="flex-1 text-sm">
              <p>{item.product.name}</p>
              <p className="text-xs text-text-dark/50">
                {item.size ? `Size ${item.size} · ` : ""}Qty {item.quantity}
              </p>
            </div>
            <p className="text-sm">{formatPrice(item.product.price * item.quantity)}</p>
          </li>
        ))}
      </ul>

      <div className="space-y-1.5 border-t border-black/10 pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-text-dark/60">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-dark/60">Shipping</span>
          <span>{shipping == null ? "—" : shipping === 0 ? "Free" : formatPrice(shipping)}</span>
        </div>
        <div className="flex justify-between border-t border-black/10 pt-1.5 font-medium">
          <span>Total</span>
          <span>{formatPrice(subtotal + (shipping ?? 0))}</span>
        </div>
      </div>
    </div>
  );
}
