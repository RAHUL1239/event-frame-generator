import type { FrameThemeKey } from "./frame-themes";
import { loadImage } from "./utils";

export type FrameContentInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type FrameFullOverlayConfig = {
  src: string;
  /** Transparent hole inset as a fraction of canvas width (e.g. 130/1080). */
  holeInsetRatio: number;
  /** Extra inner padding (px at 1080) keeping text away from the frame art. */
  contentPadding?: number;
};

export type PosterLayoutContext = {
  inset: number;
  innerW: number;
  innerH: number;
};

/** Inset used for vector-drawn frames (elegant gold, youth, etc.). */
export const VECTOR_FRAME_INSET = 36;

export const FRAME_FULL_OVERLAYS: Partial<
  Record<FrameThemeKey, FrameFullOverlayConfig>
> = {
  "traditional-maharashtrian": {
    src: "/frames/maharashtrian-frame.png",
    holeInsetRatio: 130 / 1080,
    contentPadding: 100,
  },
};

const overlayCache = new Map<FrameThemeKey, Promise<HTMLImageElement>>();

function overlayImageUrl(src: string): string {
  return src.startsWith("http")
    ? src
    : `${typeof window !== "undefined" ? window.location.origin : ""}${src}`;
}

export function hasFrameOverlayTheme(themeKey: FrameThemeKey | null | undefined) {
  return Boolean(themeKey && FRAME_FULL_OVERLAYS[themeKey]);
}

/** @deprecated Use hasFrameOverlayTheme */
export function hasBorderStripTheme(themeKey: FrameThemeKey | null | undefined) {
  return hasFrameOverlayTheme(themeKey);
}

export function getFrameOverlayInset(
  themeKey: FrameThemeKey | null | undefined,
  canvasWidth: number
): number {
  const config = themeKey ? FRAME_FULL_OVERLAYS[themeKey] : undefined;
  if (!config) return 0;
  return Math.max(36, Math.round(canvasWidth * config.holeInsetRatio));
}

export function getFrameContentInset(
  themeKey: FrameThemeKey | null | undefined,
  canvasWidth: number
): number {
  if (!hasFrameOverlayTheme(themeKey)) {
    return VECTOR_FRAME_INSET;
  }

  const config = FRAME_FULL_OVERLAYS[themeKey!]!;
  const holeInset = getFrameOverlayInset(themeKey, canvasWidth);
  const extraPadding = Math.round(
    ((config.contentPadding ?? 0) * canvasWidth) / 1080
  );
  return holeInset + extraPadding;
}

export function getFrameBorderWidth(
  themeKey: FrameThemeKey | null | undefined,
  canvasWidth: number
): number {
  return getFrameOverlayInset(themeKey, canvasWidth);
}

export function getPosterLayout(
  themeKey: FrameThemeKey | null | undefined,
  canvasW: number,
  canvasH: number
): PosterLayoutContext {
  const inset = getFrameContentInset(themeKey, canvasW);
  return {
    inset,
    innerW: canvasW - inset * 2,
    innerH: canvasH - inset * 2,
  };
}

/** Map a design-space X coordinate into the padded content area. */
export function layoutX(
  layout: PosterLayoutContext,
  x: number,
  canvasW: number
): number {
  return layout.inset + (x / canvasW) * layout.innerW;
}

/** Map a design-space Y coordinate into the padded content area. */
export function layoutY(
  layout: PosterLayoutContext,
  y: number,
  canvasH: number
): number {
  return layout.inset + (y / canvasH) * layout.innerH;
}

/** Scale a design-space radius/length for the padded content area. */
export function layoutScale(
  layout: PosterLayoutContext,
  value: number,
  canvasW: number
): number {
  return value * (layout.innerW / canvasW);
}

export function getFrameContentInsets(
  themeKey: FrameThemeKey | null | undefined,
  canvasWidth: number,
  canvasHeight: number
): FrameContentInsets {
  const layout = getPosterLayout(themeKey, canvasWidth, canvasHeight);
  return {
    top: layout.inset,
    right: layout.inset,
    bottom: layout.inset,
    left: layout.inset,
  };
}

export function getFrameContentBox(
  themeKey: FrameThemeKey | null | undefined,
  canvasWidth: number,
  canvasHeight: number
) {
  const layout = getPosterLayout(themeKey, canvasWidth, canvasHeight);
  return {
    x: layout.inset,
    y: layout.inset,
    w: layout.innerW,
    h: layout.innerH,
    inset: getFrameContentInsets(themeKey, canvasWidth, canvasHeight),
  };
}

async function loadFrameOverlayImage(
  key: FrameThemeKey
): Promise<HTMLImageElement | null> {
  const config = FRAME_FULL_OVERLAYS[key];
  if (!config) return null;

  let pending = overlayCache.get(key);
  if (!pending) {
    pending = prepareOverlayWithHole(key, config);
    overlayCache.set(key, pending);
  }

  try {
    return await pending;
  } catch {
    overlayCache.delete(key);
    return null;
  }
}

async function prepareOverlayWithHole(
  key: FrameThemeKey,
  config: FrameFullOverlayConfig
): Promise<HTMLImageElement> {
  const source = await loadImage(overlayImageUrl(config.src));
  const width = source.naturalWidth;
  const height = source.naturalHeight;
  const inset = Math.round(width * config.holeInsetRatio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error(`Failed to prepare frame overlay for ${key}`);
  }

  ctx.drawImage(source, 0, 0);
  ctx.clearRect(inset, inset, width - inset * 2, height - inset * 2);

  return loadImage(canvas.toDataURL("image/png"));
}

export async function paintFrameFullOverlay(
  ctx: CanvasRenderingContext2D,
  themeKey: FrameThemeKey | null | undefined,
  width: number,
  height: number
) {
  if (!themeKey || !FRAME_FULL_OVERLAYS[themeKey]) return;

  const image = await loadFrameOverlayImage(themeKey);
  if (!image) return;

  const prevSmoothing = ctx.imageSmoothingEnabled;
  const prevQuality = ctx.imageSmoothingQuality;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, width, height);
  ctx.imageSmoothingEnabled = prevSmoothing;
  ctx.imageSmoothingQuality = prevQuality;
}

/** @deprecated Use paintFrameFullOverlay */
export async function paintFrameBorderStrips(
  ctx: CanvasRenderingContext2D,
  themeKey: FrameThemeKey | null | undefined,
  width: number,
  height: number
) {
  await paintFrameFullOverlay(ctx, themeKey, width, height);
}
