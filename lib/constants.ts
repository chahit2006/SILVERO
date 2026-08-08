// Shared constants that would otherwise cause a circular import between
// lib/auth.ts and lib/cart.ts (both need the guest-cart cookie name).
export const CART_COOKIE = "silvero_cart_sid";
