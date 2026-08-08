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
