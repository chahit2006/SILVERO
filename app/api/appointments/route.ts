import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getStore, STORES } from "@/lib/stores";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// POST /api/appointments — API_SPEC.md. SECURITY_CHECKLIST.md §9: rate-limit
// forms that don't require login.
const schema = z.object({
  guestName: z.string().trim().min(1).max(100),
  guestContact: z.string().trim().min(1).max(100),
  service: z.enum(["Styling Consultation", "Engraving", "Try-On"]),
  date: z.string().datetime(),
  storeId: z.enum(STORES.map((s) => s.id) as [string, ...string[]]),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(`appointment:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form for errors." }, { status: 400 });
  }

  const store = getStore(parsed.data.storeId);
  if (!store) return NextResponse.json({ error: "Select a valid store." }, { status: 400 });

  const appointmentDate = new Date(parsed.data.date);
  if (appointmentDate.getTime() < Date.now()) {
    return NextResponse.json({ error: "Pick a date in the future." }, { status: 400 });
  }

  const appointment = await db.appointment.create({
    data: {
      guestName: parsed.data.guestName,
      guestContact: parsed.data.guestContact,
      service: parsed.data.service,
      date: appointmentDate,
      storeId: parsed.data.storeId,
    },
  });

  return NextResponse.json({ appointment, store }, { status: 201 });
}
