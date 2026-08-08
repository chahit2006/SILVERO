import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// NOTE: this route isn't listed in API_SPEC.md — NextAuth's credentials
// provider verifies logins but has no built-in account-creation endpoint, so
// something has to insert the User row. Added here under /api/auth/ to sit
// next to the NextAuth handler. Flagged for API_SPEC.md to be updated.

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(200),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(20).optional(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(`register:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { email, password, firstName, lastName, phone } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: { email, passwordHash, firstName, lastName, phone },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
