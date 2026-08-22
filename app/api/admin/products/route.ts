import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/auth";
import { processProductPhotos, processBarcodeUpload, UploadValidationError } from "@/lib/image-upload";
import { lowStockWhere, parseSizeStocks } from "@/lib/stock";

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
      // PRODUCT_MGMT_PHASE_PLAN.md Phase 3 — see lib/stock.ts's lowStockWhere().
      ...(lowStockOnly ? lowStockWhere() : {}),
      ...(includeArchived ? {} : { isArchived: false }),
    },
    include: { category: true, sizeStocks: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products });
}

// "" (the form's "— None —") clears the column; an absent key leaves it alone.
const emptyToNull = (schema: z.ZodString) =>
  schema.optional().transform((v) => (v === "" ? null : v));

const productSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
  // PRODUCT_MGMT_PHASE_PLAN.md Phase 2 — admin-typed identifier, distinct
  // from `id` (internal cuid) and `slug` (URL-facing). Optional: the form
  // only sends this key when non-empty, same convention as material/stone/etc.
  sku: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/, "Product ID / SKU can only contain letters, numbers, hyphens, and underscores.")
    .optional(),
  categoryId: z.string().min(1),
  price: z.coerce.number().int().positive(),
  stock: z.coerce.number().int().min(0),
  // FILTER_SPEC_IMPLEMENTATION.md Part 1 — these are now dropdowns fed by
  // the Attributes Manager, and the form always sends them so "— None —" can
  // clear one. "" therefore has to mean null, not an empty-string tag that no
  // filter would ever match. Values are not validated against FilterOption:
  // products tagged before the manager existed still have to be editable
  // without being forced onto a listed option first (Part 2's FK columns are
  // where that constraint properly belongs).
  material: emptyToNull(z.string().trim().max(200)),
  stone: emptyToNull(z.string().trim().max(200)),
  occasion: emptyToNull(z.string().trim().max(100)),
  description: z.string().trim().max(2000).optional(),
  // PRODUCT_MGMT_PHASE_PLAN.md Phase 3 — JSON-encoded {size, stock}[],
  // replacing the old comma-separated sizeOptions text field. Validated as a
  // loose string here; shape-checked below once parsed, same two-step
  // pattern existingImages (PATCH route) already uses for its JSON field.
  sizeStocks: z.string().trim().optional(),
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

  if (parsed.data.sku) {
    const existingSku = await db.product.findUnique({ where: { sku: parsed.data.sku } });
    if (existingSku) return NextResponse.json({ error: "That Product ID / SKU is already in use." }, { status: 409 });
  }

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

  // PRODUCT_MGMT_PHASE_PLAN.md Phase 1 — optional, single file, own pipeline
  // (see processBarcodeUpload's doc comment for why it's not processProductPhotos).
  const barcodeFile = formData.get("barcodeImage");
  let barcodeImageUrl: string | undefined;
  if (barcodeFile instanceof File && barcodeFile.size > 0) {
    try {
      barcodeImageUrl = await processBarcodeUpload([barcodeFile]);
    } catch (err) {
      if (err instanceof UploadValidationError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      console.error("Barcode image processing failed:", err);
      return NextResponse.json({ error: "Could not process the barcode image. Please try again." }, { status: 500 });
    }
  }

  const sizeRows = parseSizeStocks(parsed.data.sizeStocks);
  if ("error" in sizeRows) return NextResponse.json({ error: sizeRows.error }, { status: 400 });

  const { sizeStocks: _sizeStocksRaw, ...rest } = parsed.data;

  const product = await db.product.create({
    data: {
      ...rest,
      images: imageUrls,
      barcodeImage: barcodeImageUrl,
      // sizeOptions (customer-facing, drives ProductDetailDrawer.tsx) and
      // sizeStocks (admin per-size inventory) are written from the same
      // rows so they can't drift — PRODUCT_MGMT_PHASE_PLAN.md Phase 3.
      sizeOptions: sizeRows.map((r) => r.size),
      sizeStocks: sizeRows.length > 0 ? { create: sizeRows.map((r) => ({ size: r.size, stock: r.stock })) } : undefined,
      isBestseller: parsed.data.isBestseller ?? false,
      isNew: parsed.data.isNew ?? false,
    },
  });

  console.info(`Admin ${admin.email} created product ${product.id} (${product.name})`);

  return NextResponse.json({ product }, { status: 201 });
}
