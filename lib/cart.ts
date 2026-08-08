import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { getSessionUser } from "./auth";
import { CART_COOKIE } from "./constants";

// Guest carts are identified by a cookie, not a logged-in user — see
// DATA_MODEL.md "Notes" and NFR-1 (cart persists server-side, not just in
// browser state). Merged into the real user cart on login (see lib/auth.ts).

export type CartOwner = { userId: string | null; sessionId: string | null };

export async function getCartOwner(): Promise<CartOwner> {
  const user = await getSessionUser();
  if (user?.id) return { userId: user.id, sessionId: null };

  const store = cookies();
  let sid = store.get(CART_COOKIE)?.value;
  if (!sid) {
    sid = randomUUID();
    store.set(CART_COOKIE, sid, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 90, // 90 days
    });
  }
  return { userId: null, sessionId: sid };
}

export function cartWhere(owner: CartOwner) {
  return owner.userId ? { userId: owner.userId } : { sessionId: owner.sessionId };
}
