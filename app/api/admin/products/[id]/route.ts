import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/auth";
import { processProductPhotos, processBarcodeUpload, UploadValidationError } from "@/lib/image-upload";
import { parseSizeStocks } from "@/lib/stock";

// GET/PATCH/DELETE /api/admin/products/[id] — ADMIN_PANEL_SPEC.md §3/§6.
// DELETE is a soft-delete (isArchived = true), never a real row deletion —
// spec §3: a hard delete would break OrderItem history for past sales.

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const product = await db.product.findUnique({ where: { id: params.id }, include: { category: true, sizeStocks: true } });
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
  // PRODUCT_MGMT_PHASE_PLAN.md Phase 2 — same field/validation as the POST
  // route. Omitted from the form when blank (same convention as
  // material/stone/occasion below), so an empty value never overwrites an
  // existing sku — there's no "clear" affordance for those fields either.
  sku: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/, "Product ID / SKU can only contain letters, numbers, hyphens, and underscores.")
    .optional(),
  categoryId: z.string().min(1).optional(),
  price: z.coerce.number().int().positive().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  material: z.string().trim().max(200).optional(),
  stone: z.string().trim().max(200).optional(),
  occasion: z.string().trim().max(100).optional(),
  description: z.string().trim().max(2000).optional(),
  // PRODUCT_MGMT_PHASE_PLAN.md Phase 3 — see parseSizeStocks() in lib/stock.ts.
  sizeStocks: z.string().trim().optional(),
  weightGrams: z.coerce.number().int().positive().optional(),
  isBestseller: z.coerce.boolean().optional(),
  isNew: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional(),
  existingImages: z.string().optional(), // JSON-encoded string[] of URLs to keep
  // PRODUCT_MGMT_PHASE_PLAN.md Phase 1 — "false" means the admin clicked
  // Remove on the existing barcode image; absent/"true" means keep it as-is
  // unless a new file also came in (new file always wins).
  keepBarcodeImage: z.coerce.boolean().optional(),
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
  if (parsed.data.sku && parsed.data.sku !== product.sku) {
    const existingSku = await db.product.findUnique({ where: { sku: parsed.data.sku } });
    if (existingSku) return NextResponse.json({ error: "That Product ID / SKU is already in use." }, { status: 409 });
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

  // PRODUCT_MGMT_PHASE_PLAN.md Phase 1 — a new file always replaces the
  // existing barcode image; otherwise keepBarcodeImage:false clears it and
  // anything else leaves it untouched.
  const barcodeFile = formData.get("barcodeImage");
  let barcodeImageUpdate: string | null | undefined;
  if (barcodeFile instanceof File && barcodeFile.size > 0) {
    try {
      barcodeImageUpdate = await processBarcodeUpload([barcodeFile]);
    } catch (err) {
      if (err instanceof UploadValidationError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      console.error("Barcode image processing failed:", err);
      return NextResponse.json({ error: "Could not process the barcode image. Please try again." }, { status: 500 });
    }
  } else if (parsed.data.keepBarcodeImage === false) {
    barcodeImageUpdate = null;
  }

  let sizeRows: { size: string; stock: number }[] | undefined;
  if (parsed.data.sizeStocks !== undefined) {
    const result = parseSizeStocks(parsed.data.sizeStocks);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    sizeRows = result;
  }

  const { sizeStocks: _sizeStocksRaw, existingImages: _existingImages, keepBarcodeImage: _keepBarcodeImage, ...rest } = parsed.data;

  // PRODUCT_MGMT_PHASE_PLAN.md Phase 3 — when the form sends size rows,
  // sync ProductSizeStock to match exactly (delete removed sizes, upsert the
  // rest) in the same transaction as the Product update, and derive
  // sizeOptions from the same rows so the two can't drift apart. Nothing
  // sizing-related touches the DB when sizeStocks wasn't sent at all.
  const updated = await db.$transaction(async (tx) => {
    if (sizeRows !== undefined) {
      await tx.productSizeStock.deleteMany({
        where: { productId: params.id, size: { notIn: sizeRows.map((r) => r.size) } },
      });
      for (const row of sizeRows) {
        await tx.productSizeStock.upsert({
          where: { productId_size: { productId: params.id, size: row.size } },
          create: { productId: params.id, size: row.size, stock: row.stock },
          update: { stock: row.stock },
        });
      }
    }

    return tx.product.update({
      where: { id: params.id },
      data: {
        ...rest,
        images: [...keptImages, ...newUrls],
        ...(barcodeImageUpdate !== undefined ? { barcodeImage: barcodeImageUpdate } : {}),
        ...(sizeRows !== undefined ? { sizeOptions: sizeRows.map((r) => r.size) } : {}),
      },
    });
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
