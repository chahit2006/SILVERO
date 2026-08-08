import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { getCircleMemberOrNull } from "@/lib/circle";
import { processCustomOrderPhotos, UploadValidationError } from "@/lib/image-upload";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/circle/custom-order — API_SPEC.md: "Server-side membership check
// required. Accepts form + photo uploads." This check is independent of the
// /account/circle/custom-order page's own gate (ARCHITECTURE.md §"Membership
// Gating" point 3) — a direct API call with no session, or a session
// belonging to a non-member, must be rejected the same way the page is.

const fieldsSchema = z.object({
  jewelleryType: z.string().trim().min(1).max(50),
  description: z.string().trim().min(1).max(2000),
  sizing: z.string().trim().max(500).optional(),
  netWeightGrams: z.coerce.number().int().positive().max(2000).optional(),
  melting: z.string().trim().min(1).max(100),
  budgetRange: z.string().trim().min(1).max(50),
  timeline: z.string().trim().min(1).max(50),
  contactPreference: z.enum(["Phone", "WhatsApp", "Email"]),
});

function generateReferenceNumber() {
  return `SVC-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function POST(req: Request) {
  const member = await getCircleMemberOrNull();
  if (!member) {
    return NextResponse.json({ error: "SILVERO Circle membership required." }, { status: 403 });
  }

  // SECURITY_CHECKLIST.md §9 — rate-limit even though this is already gated.
  if (!rateLimit(`custom-order:${member.user.id}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
  }

  const parsed = fieldsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form for errors." }, { status: 400 });
  }

  const photoFiles = formData.getAll("photos").filter((v): v is File => v instanceof File);

  let photoUrls: string[];
  try {
    photoUrls = await processCustomOrderPhotos(photoFiles);
  } catch (err) {
    if (err instanceof UploadValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Custom order photo processing failed:", err);
    return NextResponse.json({ error: "Could not process photos. Please try again." }, { status: 500 });
  }

  const customOrder = await db.customOrder.create({
    data: {
      userId: member.user.id,
      referenceNumber: generateReferenceNumber(),
      photos: photoUrls,
      ...parsed.data,
    },
  });

  // Confirmation email would go here — no transactional email provider is
  // configured yet (same gap as forgot-password). The reference number is
  // returned directly and viewable at /account/circle/custom-order in the
  // meantime.

  return NextResponse.json(
    { id: customOrder.id, referenceNumber: customOrder.referenceNumber },
    { status: 201 },
  );
}

// No GET here — API_SPEC.md only documents POST at this path (a per-id GET
// lives at /api/circle/custom-order/[id]). The /account/circle/custom-order
// page's submission list queries Prisma directly server-side instead,
// matching every other account page's pattern (orders, wishlist, etc.).
