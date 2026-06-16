import type { EventWithOptions } from "./types";
import type { PhotoCrop } from "./photo-crop";
import { DEFAULT_PHOTO_CROP } from "./photo-crop";

export const DEFAULT_EVENT_LOGO = "/mkm-logo.png";

export function getEventTheme(event: EventWithOptions) {
  return {
    primary: event.primaryColor,
    accent: event.accentColor,
    background: event.backgroundColor,
  };
}

export function getEventLogoUrl(event: { logoUrl?: string | null }): string {
  return event.logoUrl || DEFAULT_EVENT_LOGO;
}

export async function loadEventLogo(
  event: { logoUrl?: string | null }
): Promise<HTMLImageElement> {
  const path = getEventLogoUrl(event);
  const src = path.startsWith("http")
    ? path
    : `${window.location.origin}${path}`;
  return loadImage(src);
}

export function drawLogo(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement,
  centerX: number,
  topY: number,
  maxWidth: number,
  maxHeight?: number
): number {
  let scale = maxWidth / logo.width;
  if (maxHeight) {
    scale = Math.min(scale, maxHeight / logo.height);
  }
  const w = logo.width * scale;
  const h = logo.height * scale;
  ctx.drawImage(logo, centerX - w / 2, topY, w, h);
  return h;
}

export function formatDisplayName(
  firstName?: string | null,
  lastName?: string | null
): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function drawCircularImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  radius: number,
  crop: PhotoCrop = DEFAULT_PHOTO_CROP
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const size = radius * 2;
  const baseScale = Math.max(size / img.width, size / img.height);
  const scale = baseScale * crop.scale;
  const w = img.width * scale;
  const h = img.height * scale;

  const maxPanX = Math.max(0, (w - size) / 2);
  const maxPanY = Math.max(0, (h - size) / 2);
  const drawX = x - w / 2 + crop.offsetX * maxPanX;
  const drawY = y - h / 2 + crop.offsetY * maxPanY;

  ctx.drawImage(img, drawX, drawY, w, h);
  ctx.restore();
}

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, currentY);
}
