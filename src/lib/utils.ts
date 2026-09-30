import type { EventWithOptions } from "./types";
import type { PhotoCrop } from "./photo-crop";
import { DEFAULT_PHOTO_CROP } from "./photo-crop";
import { isPrivateBlobUrl } from "./logo-url";

export const DEFAULT_EVENT_LOGO = "/mkm-logo.png";

export function getEventTheme(event: EventWithOptions) {
  return {
    primary: event.primaryColor,
    accent: event.accentColor,
    background: event.backgroundColor,
  };
}

export function getEventLogoUrl(event: { logoUrl?: string | null }): string {
  const logoUrl = event.logoUrl || DEFAULT_EVENT_LOGO;
  if (isPrivateBlobUrl(logoUrl)) {
    return `/api/logos?url=${encodeURIComponent(logoUrl)}`;
  }
  return logoUrl;
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

/** Draw logo with top-left anchor (for BMM-style header). */
export function drawLogoAt(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement,
  leftX: number,
  topY: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const scale = Math.min(maxWidth / logo.width, maxHeight / logo.height);
  const w = logo.width * scale;
  const h = logo.height * scale;
  ctx.drawImage(logo, leftX, topY, w, h);
  return { width: w, height: h };
}

const logoMatteCache = new Map<string, HTMLCanvasElement>();

function isLogoForegroundPixel(r: number, g: number, b: number) {
  if (r > 205 && g > 205 && b > 205) return true;
  if (g > 145 && r > 165 && b < 120) return true;
  if (r > 118 && g > 88 && r >= b + 22) return true;
  if (r > 175 && g > 145 && b > 75) return true;
  return false;
}

function removeLogoMatte(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tolerance: number
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const centerIndex = (cy * width + cx) * 4;
  const matte = {
    r: data[centerIndex],
    g: data[centerIndex + 1],
    b: data[centerIndex + 2],
  };

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isLogoForegroundPixel(r, g, b)) continue;

    const distance = Math.hypot(r - matte.r, g - matte.g, b - matte.b);
    if (distance <= tolerance) {
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/** Draw logo without the solid maroon/white matte (Traditional Maharashtrian). */
export function drawLogoAtWithoutMatte(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement,
  leftX: number,
  topY: number,
  maxWidth: number,
  maxHeight: number,
  matteTolerance = 52
): { width: number; height: number } {
  const scale = Math.min(maxWidth / logo.width, maxHeight / logo.height);
  const w = Math.max(1, Math.ceil(logo.width * scale));
  const h = Math.max(1, Math.ceil(logo.height * scale));
  const cacheKey = `${logo.src}|${w}x${h}|t${matteTolerance}`;

  let processed = logoMatteCache.get(cacheKey);
  if (!processed) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const patch = canvas.getContext("2d");
    if (!patch) {
      ctx.drawImage(logo, leftX, topY, w, h);
      return { width: w, height: h };
    }
    patch.drawImage(logo, 0, 0, w, h);
    removeLogoMatte(patch, w, h, matteTolerance);
    processed = canvas;
    logoMatteCache.set(cacheKey, processed);
  }

  ctx.drawImage(processed, leftX, topY, w, h);
  return { width: w, height: h };
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
    if (!src.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
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
