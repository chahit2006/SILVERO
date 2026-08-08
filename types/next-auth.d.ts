import { DefaultSession } from "next-auth";

// Augment NextAuth's session/JWT types to carry our User.id — TECH_STACK.md
// requires server-side membership/ownership checks, which need the real DB id.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
