import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { generateOtp, hashOtp, signMfaToken, OTP_TTL_MS } from "@/lib/mfa";

// POST /api/auth/mfa/request-otp — MFA step 1. Not listed in API_SPEC.md yet
// at time of writing this comment; flagged for the same doc to be updated
// (same situation register/route.ts already notes for itself).
//
// Verifies { email, password } exactly like lib/auth.ts's credentials
// provider used to, but instead of minting a real session, it issues a
// 6-digit OTP (emailed, bcrypt-hashed at rest) and a short-lived
// "mfa_pending" JWT the client carries to step 2. The real session is only
// ever issued by NextAuth's authorize() after that OTP is verified —
// this route can never log anyone in by itself.

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { email, password } = parsed.data;

  // SECURITY_CHECKLIST.md §1 pattern, same as lib/auth.ts's login rate limit —
  // blocks repeated OTP-request spam (and password-guessing) against one email.
  if (!rateLimit(`mfa-otp:${email}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const user = await db.user.findUnique({ where: { email } });

  // Deliberately generic — same "Invalid email or password." wording and
  // status as the old single-step login, so this endpoint can't be used to
  // enumerate registered emails.
  const genericError = () => NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  if (!user) return genericError();

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) return genericError();

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);

  await db.user.update({
    where: { id: user.id },
    data: { otpHash, otpExpiresAt, otpAttemptCount: 0 },
  });

  const mfaToken = await signMfaToken(user.id);

  // EMAIL PROVIDER NOT YET CONFIGURED (BUILD_STATUS.md flagged gap — no
  // transactional email provider in this codebase yet). Once one is picked,
  // this block becomes a call to lib/email.ts's sendOtpEmail(user.email, otp),
  // gated on that provider's API key env var being set — same
  // configured/unconfigured graceful-degrade shape as lib/cashfree.ts and
  // lib/shiprocket.ts. Until then every environment takes the "unconfigured"
  // path: log instead of send, so login stays testable locally.
  //
  // Never log the OTP outside this explicit dev fallback.
  console.info(`[DEV MODE — email not configured] OTP for ${email}: ${otp}`);

  return NextResponse.json({ mfaToken });
}
