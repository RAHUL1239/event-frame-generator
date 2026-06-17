import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const LOCAL_DIR = path.join(process.cwd(), "public", "uploads", "logos");

export async function saveEventLogo(
  eventSlug: string,
  file: File,
  ext: string
): Promise<string> {
  const filename = `${eventSlug}-${Date.now()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`logos/${filename}`, bytes, {
        access: "public",
        contentType: file.type || `image/${ext === "jpg" ? "jpeg" : ext}`,
        addRandomSuffix: false,
      });
      return blob.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Blob upload failed";
      throw new Error(`Failed to upload logo to storage: ${message}`);
    }
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Logo storage is not configured. Add BLOB_READ_WRITE_TOKEN to your Vercel project environment variables."
    );
  }

  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_DIR, filename), bytes);
  return `/uploads/logos/${filename}`;
}

export function resolveLogoMimeType(file: File): string | null {
  const allowed: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
  };

  if (allowed[file.type]) return file.type;

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";

  return null;
}

export function mimeToLogoExt(mime: string): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
  };
  return map[mime] ?? "png";
}
