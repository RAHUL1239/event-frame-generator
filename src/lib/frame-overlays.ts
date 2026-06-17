import type { FrameThemeKey } from "./frame-themes";
import { loadImage } from "./utils";

export type FrameOverlayConfig = {
  src: string;
  /** Crop from source image. Omit to use the full image. */
  sourceRect?: { x: number; y: number; width: number; height: number };
  previewSrc?: string;
  /** When true, grey/checkerboard pixels become transparent and the frame draws on top of content. */
  transparentCenter?: boolean;
};

export const FRAME_OVERLAYS: Partial<Record<FrameThemeKey, FrameOverlayConfig>> = {
  "traditional-maharashtrian": {
    src: "/frames/maharashtrian-heritage-frame.png",
    sourceRect: { x: 465, y: 0, width: 559, height: 559 },
    previewSrc: "/frames/maharashtrian-heritage-frame.png",
    transparentCenter: true,
  },
};

const imageCache = new Map<FrameThemeKey, Promise<HTMLImageElement>>();
const processedCache = new Map<FrameThemeKey, Promise<HTMLCanvasElement>>();

export function getFrameOverlayConfig(
  key: FrameThemeKey | null | undefined
): FrameOverlayConfig | null {
  if (!key) return null;
  return FRAME_OVERLAYS[key] ?? null;
}

function overlayImageUrl(src: string): string {
  return src.startsWith("http")
    ? src
    : `${typeof window !== "undefined" ? window.location.origin : ""}${src}`;
}

export async function loadFrameOverlayImage(
  key: FrameThemeKey
): Promise<HTMLImageElement | null> {
  const config = FRAME_OVERLAYS[key];
  if (!config) return null;

  let pending = imageCache.get(key);
  if (!pending) {
    pending = loadImage(overlayImageUrl(config.src));
    imageCache.set(key, pending);
  }

  try {
    return await pending;
  } catch {
    imageCache.delete(key);
    return null;
  }
}

function isTransparentOverlayPixel(r: number, g: number, b: number): boolean {
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  if (spread >= 32) return false;

  const avg = (r + g + b) / 3;
  return avg > 80 && avg < 238;
}

function buildProcessedOverlayCanvas(
  image: HTMLImageElement,
  config: FrameOverlayConfig
): HTMLCanvasElement {
  const source = config.sourceRect ?? {
    x: 0,
    y: 0,
    width: image.naturalWidth,
    height: image.naturalHeight,
  };

  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.drawImage(
    image,
    source.x,
    source.y,
    source.width,
    source.height,
    0,
    0,
    source.width,
    source.height
  );

  if (config.transparentCenter) {
    const imageData = ctx.getImageData(0, 0, source.width, source.height);
    const { data } = imageData;
    for (let i = 0; i < data.length; i += 4) {
      if (isTransparentOverlayPixel(data[i], data[i + 1], data[i + 2])) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  return canvas;
}

async function loadProcessedOverlayCanvas(
  key: FrameThemeKey
): Promise<HTMLCanvasElement | null> {
  const config = FRAME_OVERLAYS[key];
  if (!config) return null;

  let pending = processedCache.get(key);
  if (!pending) {
    pending = loadFrameOverlayImage(key).then((image) => {
      if (!image) throw new Error("overlay image missing");
      return buildProcessedOverlayCanvas(image, config);
    });
    processedCache.set(key, pending);
  }

  try {
    return await pending;
  } catch {
    processedCache.delete(key);
    return null;
  }
}

export function drawFrameOverlay(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  width: number,
  height: number
) {
  ctx.drawImage(image, 0, 0, width, height);
}

export async function loadThemeFrameOverlay(themeKey: FrameThemeKey | null) {
  if (!themeKey) return null;
  const config = getFrameOverlayConfig(themeKey);
  if (!config) return null;

  if (config.transparentCenter) {
    const canvas = await loadProcessedOverlayCanvas(themeKey);
    if (!canvas) return null;
    return { image: canvas, config, drawOnTop: true as const };
  }

  const image = await loadFrameOverlayImage(themeKey);
  if (!image) return null;
  return { image, config, drawOnTop: false as const };
}

export async function paintFrameBorderOverlay(
  ctx: CanvasRenderingContext2D,
  themeKey: FrameThemeKey | null | undefined,
  width: number,
  height: number
) {
  const overlay = await loadThemeFrameOverlay(themeKey ?? null);
  if (!overlay?.drawOnTop) return;
  drawFrameOverlay(ctx, overlay.image, width, height);
}
