export function isPrivateBlobUrl(url: string): boolean {
  return url.includes("private.blob.vercel-storage.com");
}
