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
    const blob = await put(`logos/${filename}`, bytes, {
      access: "public",
      contentType: file.type,
    });
    return blob.url;
  }

  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_DIR, filename), bytes);
  return `/uploads/logos/${filename}`;
}
