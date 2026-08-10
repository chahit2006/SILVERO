import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Email-OTP MFA — second factor after password, applies to every login
// (customer and admin both go through the one credentials provider in
// lib/auth.ts). Shared by app/api/auth/mfa/request-otp/route.ts (step 1:
// verifies password, issues the OTP + this token) and lib/auth.ts's
// authorize() (step 2: verifies the OTP against this token). Kept in one
// module so both call sites use the same constants instead of duplicating
// them and drifting apart.
//
// Deliberately a *separate* signing secret from NEXTAUTH_SECRET — this token
// only ever proves "password was correct, OTP still owed," never a real
// session, and the two token systems must not be interchangeable.

const MFA_JWT_PURPOSE = "mfa_pending";
const MFA_JWT_TTL = "5m";

/** OTP validity window — must match the expiry written alongside otpHash. */
export const OTP_TTL_MS = 5 * 60 * 1000;
/** After this many wrong guesses against one issued code, it's dead — request a new one. */
export const OTP_MAX_ATTEMPTS = 5;

function mfaSecret(): Uint8Array {
  const secret = process.env.MFA_JWT_SECRET;
  if (!secret) {
    // Hard failure, not a silent fallback — an MFA token signed with an
    // empty/guessable key would defeat the entire point of the second factor.
    throw new Error("MFA_JWT_SECRET is not set.");
  }
  return new TextEncoder().encode(secret);
}

/** Signs the short-lived "password verified, awaiting OTP" token — step 1's only output. */
export async function signMfaToken(userId: string): Promise<string> {
  return new SignJWT({ userId, purpose: MFA_JWT_PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(MFA_JWT_TTL)
    .sign(mfaSecret());
}

/**
 * Verifies signature, expiry, and purpose. Returns the userId on success, or
 * null for anything wrong — expired, tampered, wrong purpose, malformed.
 * Never throws for bad input; a bad/expired token at the OTP step is an
 * expected case (the user waited too long), not an exceptional one.
 */
export async function verifyMfaToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, mfaSecret());
    if (payload.purpose !== MFA_JWT_PURPOSE || typeof payload.userId !== "string") return null;
    return payload.userId;
  } catch {
    return null;
  }
}

/** Cryptographically random 6-digit code, zero-padded (e.g. "004821"). */
export function generateOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Same hashing approach as User.passwordHash — bcrypt, never stored/logged in plaintext. */
export function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 12);
}

export function compareOtp(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}
