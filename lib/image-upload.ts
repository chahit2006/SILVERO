import sharp from "sharp";
import heicConvert from "heic-convert";
import { fromBuffer } from "file-type";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// CLAUDE.md: "HEIC photo uploads (Custom Order form) must be converted
// server-side before storage/display." SECURITY_CHECKLIST.md §4 — Custom
// Order photos are "the highest-risk feature in this build." Every rule
// there is implemented here:
//   - file type checked by actual signature, not extension/MIME
//   - max 5 files, max 10MB each, enforced server-side
//   - random filenames, never the user-supplied name (path traversal)
//   - stored under public/uploads/custom-orders/, served static-only
//   - every image is re-encoded through sharp, which strips EXIF/GPS
//     metadata as a side effect (also true for the HEIC branch, since
//     heic-convert's own encoder doesn't carry EXIF through either)

const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/heic", "image/heif"]);
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "custom-orders");

export class UploadValidationError extends Error {}

/**
 * Validates and converts Custom Order photo uploads, returns the public
 * URLs to store on CustomOrder.photos. Throws UploadValidationError (safe
 * to show its message to the user) on any rule violation.
 */
export async function processCustomOrderPhotos(files: File[]): Promise<string[]> {
  if (files.length === 0) {
    throw new UploadValidationError("Upload at least one photo.");
  }
  if (files.length > MAX_FILES) {
    throw new UploadValidationError(`Upload at most ${MAX_FILES} photos.`);
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

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
    await writeFile(path.join(UPLOAD_DIR, filename), jpegBuffer);
    urls.push(`/uploads/custom-orders/${filename}`);
  }

  return urls;
}
