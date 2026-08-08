import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "./db";
import { rateLimit } from "./rate-limit";
import { CART_COOKIE } from "./constants";

// TECH_STACK.md — NextAuth, credentials-based. Membership (Circle) checks are
// a separate, Phase 2 concern layered on top of this; this file only
// establishes "who is logged in," not "what are they allowed to do."
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/account/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase().trim();

        // SECURITY_CHECKLIST.md §1 — 5 attempts / 15 min per email, blocks brute-force.
        if (!rateLimit(`login:${email}`, 5, 15 * 60 * 1000)) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Merge the guest cart (cookie-based) into the now-known user's cart.
      // Simplification: if the same product+size exists in both, this
      // creates a duplicate CartItem row rather than combining quantities —
      // acceptable for now, revisit if it becomes a real UX complaint.
      if (user?.id) {
        const store = cookies();
        const sid = store.get(CART_COOKIE)?.value;
        if (sid) {
          await db.cartItem.updateMany({
            where: { sessionId: sid, userId: null },
            data: { userId: user.id, sessionId: null },
          });
          store.delete(CART_COOKIE);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id;
      return session;
    },
  },
};

/**
 * Server-side "must be logged in" gate for account pages/APIs.
 * Not a Circle-membership check — see ARCHITECTURE.md "Membership Gating"
 * for that (Phase 2). This only guarantees `session.user.id` is real.
 */
export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/account/login");
  }
  return session.user;
}

/** Same as requireUser() but returns null instead of redirecting — for API routes. */
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/**
 * ADMIN_PANEL_SPEC.md §1 — the single admin gate. Every `/admin/*` page and
 * every `/api/admin/*` route goes through this or its API-shaped sibling
 * below; there is no second place that decides who is an admin.
 *
 * Three deliberate choices:
 *
 * 1. **Role is read from the database, not from the JWT.** The session token
 *    is minted at login and lives for days — a role baked into it would keep
 *    working after an admin is demoted, and would not work for one just
 *    promoted until they signed out and back in. One indexed lookup per admin
 *    request is a fair price on an internal panel with a handful of users.
 * 2. **`=== "ADMIN"` exactly**, never `!== "CUSTOMER"` — a CIRCLE member must
 *    never satisfy an admin check.
 * 3. **Non-admins are redirected to /account, not 404'd or shown an error.**
 *    Spec §1: the response must not confirm that /admin/* exists. Logged-out
 *    visitors hit requireUser()'s /account/login redirect one line earlier and
 *    never reach the role check.
 */
export async function requireAdmin() {
  const sessionUser = await requireUser();
  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/account");
  }
  return user;
}

/**
 * Same check as requireAdmin() but for API routes — returns null instead of
 * redirecting, so the caller can answer 404. CLAUDE.md constraint #5 applies
 * to admin exactly as it does to Circle: the API route re-checks on its own,
 * independently of whatever the page layout already gated.
 */
export async function getAdminOrNull() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });

  if (!user || user.role !== "ADMIN") return null;
  return user;
}

/**
 * Spec §1 asks for an explicit decision on whether ADMIN also passes the
 * Circle gate. **It does not.** An admin previewing the member experience
 * would submit real CustomOrder rows against their own account and pollute
 * the /admin/circle-orders queue they are meant to be working; a test Circle
 * account is the cleaner way to preview it. Circle gating in lib/circle.ts
 * therefore keeps checking for a CircleMembership row and is unchanged by the
 * arrival of Role — an admin without a membership row already fails it.
 */

