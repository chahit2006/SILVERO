import { randomBytes } from "crypto";
import { db } from "./db";

function generateSlug(): string {
  return randomBytes(6).toString("hex"); // 12 hex chars — unguessable, URL-safe
}

export async function generateUniqueShareSlug(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug();
    const existing = await db.registry.findUnique({ where: { shareSlug: slug } });
    if (!existing) return slug;
  }
  throw new Error("Could not generate a unique registry link.");
}
