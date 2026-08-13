import sharp from "sharp";
import heicConvert from "heic-convert";
import { fromBuffer } from "file-type";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// CLAUDE.md: "HEIC photo uploads (Custom Order form) must be converted
// server-side before storage/display." SECURITY_CHECKLIST.md §4 — Custom
// Order photos are "the highest-risk feature in this build," and every rule
// there is implemented in processImageUploads() below:
//   - file type checked by actual signature, not extension/MIME
//   - max files + max size enforced server-side, not just in the UI
//   - random filenames, never the user-supplied name (path traversal)
//   - stored under public/uploads/<subdir>/, served static-only
//   - every image is re-encoded through sharp, which strips EXIF/GPS
//     metadata as a side effect (also true for the HEIC branch, since
//     heic-convert's own encoder doesn't carry EXIF through either)
//
// Added 2026-08-09: generalized from a Custom-Order-only function so
// /admin/products can reuse the exact same validation rigor for product
// photos rather than a second, weaker copy of it.

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/heic", "image/heif"]);

export class UploadValidationError extends Error {}

type UploadOptions = {
  subdir: string; // under public/uploads/
  maxFiles: number;
};

/**
 * Validates and converts image uploads, returns the public URLs to store.
 * Throws UploadValidationError (safe to show its message to the user) on
 * any rule violation.
 */
export async function processImageUploads(files: File[], { subdir, maxFiles }: UploadOptions): Promise<string[]> {
  if (files.length === 0) {
    throw new UploadValidationError("Upload at least one photo.");
  }
  if (files.length > maxFiles) {
    throw new UploadValidationError(`Upload at most ${maxFiles} photos.`);
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(uploadDir, { recursive: true });

  const urls: string[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new UploadValidationError(`"${file.name}" is over the 10MB limit.`);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // The actual check that matters — SECURITY_CHECKLIST.md's self-test is
    // literally "upload a .php/.exe renamed to .jpg, must be rejected by
    // signature check." A browser-reported MIME type or file extension is
    // attacker-controlled; magic-byte sniffing isn't.
    const detected = await fromBuffer(buffer);
    if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
      throw new UploadValidationError(`"${file.name}" isn't a supported image file.`);
    }

    let jpegBuffer: Buffer;
    if (detected.mime === "image/heic" || detected.mime === "image/heif") {
      const decoded = await heicConvert({ buffer, format: "JPEG", quality: 0.88 });
      jpegBuffer = await sharp(Buffer.from(decoded)).jpeg({ quality: 88 }).toBuffer();
    } else {
      // .rotate() with no args normalizes orientation using the EXIF tag
      // before that tag gets stripped by re-encoding.
      jpegBuffer = await sharp(buffer).rotate().jpeg({ quality: 88 }).toBuffer();
    }

    const filename = `${randomUUID()}.jpg`;
    await writeFile(path.join(uploadDir, filename), jpegBuffer);
    urls.push(`/uploads/${subdir}/${filename}`);
  }

  return urls;
}

/** Custom Order — PRD.md §4: up to 5 photos. */
export async function processCustomOrderPhotos(files: File[]): Promise<string[]> {
  return processImageUploads(files, { subdir: "custom-orders", maxFiles: 5 });
}

/** Admin product photos — ADMIN_PANEL_SPEC.md §3: "multi-upload". */
export async function processProductPhotos(files: File[]): Promise<string[]> {
  return processImageUploads(files, { subdir: "products", maxFiles: 8 });
}

/**
 * Admin barcode/QR image upload — PRODUCT_MGMT_PHASE_PLAN.md Phase 1.
 * Same signature-check/random-filename rigor as processImageUploads(), but
 * deliberately NOT built on top of it: that function forces every output to
 * JPEG, which is fine for photography and risky for a barcode/QR image —
 * JPEG's lossy compression can smear the sharp module edges a scanner needs
 * and break scannability. Here, PNG input stays PNG; only HEIC is converted
 * (nothing can display HEIC directly) and JPEG input is re-encoded at a
 * higher quality than the photo pipeline, since it's likely a rendered code
 * rather than a photo. Single file only.
 */
export async function processBarcodeUpload(files: File[]): Promise<string> {
  if (files.length === 0) {
    throw new UploadValidationError("Upload a barcode image.");
  }
  if (files.length > 1) {
    throw new UploadValidationError("Upload only one barcode image.");
  }

  const subdir = "barcodes";
  const uploadDir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(uploadDir, { recursive: true });

  const file = files[0];
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new UploadValidationError(`"${file.name}" is over the 10MB limit.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const detected = await fromBuffer(buffer);
  if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
    throw new UploadValidationError(`"${file.name}" isn't a supported image file.`);
  }

  let outBuffer: Buffer;
  let ext: string;
  if (detected.mime === "image/heic" || detected.mime === "image/heif") {
    const decoded = await heicConvert({ buffer, format: "JPEG", quality: 0.95 });
    outBuffer = await sharp(Buffer.from(decoded)).jpeg({ quality: 95 }).toBuffer();
    ext = "jpg";
  } else if (detected.mime === "image/png") {
    // Re-encoded through sharp (still strips EXIF/metadata the same as the
    // photo pipeline) but kept lossless — no format conversion.
    outBuffer = await sharp(buffer).rotate().png().toBuffer();
    ext = "png";
  } else {
    outBuffer = await sharp(buffer).rotate().jpeg({ quality: 95 }).toBuffer();
    ext = "jpg";
  }

  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(uploadDir, filename), outBuffer);
  return `/uploads/${subdir}/${filename}`;
}
