import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/auth";
import { processProductPhotos, UploadValidationError } from "@/lib/image-upload";

// GET/POST /api/admin/products — ADMIN_PANEL_SPEC.md §6. The list page
// itself queries Prisma directly (same pattern as every other admin/account
// list view) — this GET exists for the documented API surface and any
// future programmatic use. POST is what the "new product" form calls.

export async function GET(req: Request) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const lowStockOnly = searchParams.get("lowStock") === "true";
  const includeArchived = searchParams.get("includeArchived") === "true";

  const products = await db.product.findMany({
    where: {
      ...(category ? { category: { slug: category } } : {}),
      ...(lowStockOnly ? { stock: { lt: 5 } } : {}),
      ...(includeArchived ? {} : { isArchived: false }),
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products });
}

const productSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
  categoryId: z.string().min(1),
  price: z.coerce.number().int().positive(),
  stock: z.coerce.number().int().min(0),
  material: z.string().trim().max(200).optional(),
  stone: z.string().trim().max(200).optional(),
  occasion: z.string().trim().max(100).optional(),
  description: z.string().trim().max(2000).optional(),
  sizeOptions: z.string().trim().max(500).optional(), // comma-separated, parsed below
  weightGrams: z.coerce.number().int().positive().optional(),
  isBestseller: z.coerce.boolean().optional(),
  isNew: z.coerce.boolean().optional(),
});

export async function POST(req: Request) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });

  const parsed = productSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the form for errors." }, { status: 400 });
  }

  const category = await db.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category) return NextResponse.json({ error: "Select a valid category." }, { status: 400 });

  const existing = await db.product.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });

  const photoFiles = formData.getAll("images").filter((v): v is File => v instanceof File && v.size > 0);
  let imageUrls: string[] = [];
  if (photoFiles.length > 0) {
    try {
      imageUrls = await processProductPhotos(photoFiles);
    } catch (err) {
      if (err instanceof UploadValidationError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      console.error("Product photo processing failed:", err);
      return NextResponse.json({ error: "Could not process photos. Please try again." }, { status: 500 });
    }
  }

  const { sizeOptions, ...rest } = parsed.data;

  const product = await db.product.create({
    data: {
      ...rest,
      images: imageUrls,
      sizeOptions: sizeOptions
        ? sizeOptions.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      isBestseller: parsed.data.isBestseller ?? false,
      isNew: parsed.data.isNew ?? false,
    },
  });

  console.info(`Admin ${admin.email} created product ${product.id} (${product.name})`);

  return NextResponse.json({ product }, { status: 201 });
}
