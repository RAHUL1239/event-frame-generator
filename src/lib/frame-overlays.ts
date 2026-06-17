import type { FrameThemeKey } from "./frame-themes";
import { loadImage } from "./utils";

export type FrameOverlayConfig = {
  src: string;
  sourceRect: { x: number; y: number; width: number; height: number };
  previewSrc?: string;
};

export const FRAME_OVERLAYS: Partial<Record<FrameThemeKey, FrameOverlayConfig>> = {
  "traditional-maharashtrian": {
    src: "/frames/traditional-maharashtrian-source.jpg",
    sourceRect: { x: 430, y: 0, width: 594, height: 559 },
    previewSrc: "/frames/traditional-maharashtrian-source.jpg",
  },
};

const overlayCache = new Map<FrameThemeKey, Promise<HTMLImageElement>>();

export function getFrameOverlayConfig(
  key: FrameThemeKey | null | undefined
): FrameOverlayConfig | null {
  if (!key) return null;
  return FRAME_OVERLAYS[key] ?? null;
}

export async function loadFrameOverlayImage(
  key: FrameThemeKey
): Promise<HTMLImageElement | null> {
  const config = FRAME_OVERLAYS[key];
  if (!config) return null;

  let pending = overlayCache.get(key);
  if (!pending) {
    const src = config.src.startsWith("http")
      ? config.src
      : `${typeof window !== "undefined" ? window.location.origin : ""}${config.src}`;
    pending = loadImage(src);
    overlayCache.set(key, pending);
  }

  try {
    return await pending;
  } catch {
    overlayCache.delete(key);
    return null;
  }
}

export function drawFrameOverlay(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  config: FrameOverlayConfig,
  width: number,
  height: number
) {
  const { x, y, width: sourceWidth, height: sourceHeight } = config.sourceRect;
  ctx.drawImage(image, x, y, sourceWidth, sourceHeight, 0, 0, width, height);
}

export async function loadThemeFrameOverlay(themeKey: FrameThemeKey | null) {
  if (!themeKey) return null;
  const config = getFrameOverlayConfig(themeKey);
  if (!config) return null;
  const image = await loadFrameOverlayImage(themeKey);
  if (!image) return null;
  return { image, config };
}
