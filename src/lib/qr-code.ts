import QRCode from "qrcode";
import { loadImage } from "./utils";

export async function loadQrCodeImage(
  url: string,
  size = 128
): Promise<HTMLImageElement | null> {
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: size,
      margin: 0,
      errorCorrectionLevel: "M",
    });
    return await loadImage(dataUrl);
  } catch {
    return null;
  }
}

export function getEventQrUrl(
  event: { slug: string },
  page: "personal" | "group",
  configQr?: string
): string | undefined {
  const custom = configQr?.trim();
  if (custom) return custom;

  if (typeof window !== "undefined") {
    return `${window.location.origin}/events/${event.slug}/${page}`;
  }

  return undefined;
}
