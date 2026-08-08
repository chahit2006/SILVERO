import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/categories?gender=NAR|NARI — API_SPEC.md
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gender = searchParams.get("gender");

  const categories = await db.category.findMany({
    where: gender === "NAR" || gender === "NARI" ? { gender } : undefined,
    orderBy: { englishName: "asc" },
  });

  return NextResponse.json({ categories });
}
