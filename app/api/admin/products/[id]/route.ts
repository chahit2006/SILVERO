import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/auth";
import { processProductPhotos, UploadValidationError } from "@/lib/image-upload";

// GET/PATCH/DELETE /api/admin/products/[id] — ADMIN_PANEL_SPEC.md §3/§6.
// DELETE is a soft-delete (isArchived = true), never a real row deletion —
// spec §3: a hard delete would break OrderItem history for past sales.

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const product = await db.product.findUnique({ where: { id: params.id }, include: { category: true } });
  if (!product) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ product });
}

const patchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  categoryId: z.string().min(1).optional(),
  price: z.coerce.number().int().positive().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  material: z.string().trim().max(200).optional(),
  stone: z.string().trim().max(200).optional(),
  occasion: z.string().trim().max(100).optional(),
  description: z.string().trim().max(2000).optional(),
  sizeOptions: z.string().trim().max(500).optional(),
  weightGrams: z.coerce.number().int().positive().optional(),
  isBestseller: z.coerce.boolean().optional(),
  isNew: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional(),
  existingImages: z.string().optional(), // JSON-encoded string[] of URLs to keep
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const product = await db.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });

  const parsed = patchSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the form for errors." }, { status: 400 });
  }

  if (parsed.data.categoryId) {
    const category = await db.category.findUnique({ where: { id: parsed.data.categoryId } });
    if (!category) return NextResponse.json({ error: "Select a valid category." }, { status: 400 });
  }
  if (parsed.data.slug && parsed.data.slug !== product.slug) {
    const existing = await db.product.findUnique({ where: { slug: parsed.data.slug } });
    if (existing) return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });
  }

  let keptImages: string[] = product.images;
  if (parsed.data.existingImages != null) {
    try {
      const kept = JSON.parse(parsed.data.existingImages);
      if (Array.isArray(kept) && kept.every((u) => typeof u === "string")) {
        keptImages = kept.filter((u) => product.images.includes(u)); // only URLs this product actually owns
      }
    } catch {
      // ignore malformed value, keep existing images as-is
    }
  }

  const newFiles = formData.getAll("images").filter((v): v is File => v instanceof File && v.size > 0);
  let newUrls: string[] = [];
  if (newFiles.length > 0) {
    try {
      newUrls = await processProductPhotos(newFiles);
    } catch (err) {
      if (err instanceof UploadValidationError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      console.error("Product photo processing failed:", err);
      return NextResponse.json({ error: "Could not process photos. Please try again." }, { status: 500 });
    }
  }

  const { sizeOptions, existingImages: _existingImages, ...rest } = parsed.data;

  const updated = await db.product.update({
    where: { id: params.id },
    data: {
      ...rest,
      images: [...keptImages, ...newUrls],
      ...(sizeOptions !== undefined
        ? { sizeOptions: sizeOptions.split(",").map((s) => s.trim()).filter(Boolean) }
        : {}),
    },
  });

  console.info(`Admin ${admin.email} updated product ${updated.id} (${updated.name})`);

  return NextResponse.json({ product: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const product = await db.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const updated = await db.product.update({ where: { id: params.id }, data: { isArchived: true } });
  console.info(`Admin ${admin.email} archived product ${updated.id} (${updated.name})`);

  return NextResponse.json({ product: updated });
}
