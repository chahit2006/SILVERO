import { randomBytes } from "crypto";
import { db } from "./db";

// PRD.md §4 "Gift Cards" — preset denominations shown in the UI; custom
// amounts allowed within MIN/MAX. Not documented anywhere — reasonable
// defaults for a jewellery brand, adjust freely, unlike CIRCLE_JOIN_FEE this
// isn't blocking a real payment integration decision either way.
export const PRESET_AMOUNTS = [1000, 2500, 5000, 10000];
export const MIN_AMOUNT = 500;
export const MAX_AMOUNT = 50000;

function generateCode(): string {
  return `SLVR-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/** Codes are unique — retry on the (astronomically unlikely) collision. */
export async function generateUniqueGiftCardCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const existing = await db.giftCard.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique gift card code.");
}
