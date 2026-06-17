import type { FrameThemeKey } from "./frame-themes";
import { loadImage } from "./utils";

export type FrameContentInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type FrameBorderStripConfig = {
  src: string;
  borderWidthRatio: number;
};

export type PosterLayoutContext = {
  inset: number;
  innerW: number;
  innerH: number;
};

/** Inset used for vector-drawn frames (elegant gold, youth, etc.). */
export const VECTOR_FRAME_INSET = 36;

export const FRAME_BORDER_STRIPS: Partial<
  Record<FrameThemeKey, FrameBorderStripConfig>
> = {
  "traditional-maharashtrian": {
    src: "/frames/maharashtrian-gold-border.png",
    borderWidthRatio: 0.12,
  },
};

const stripCache = new Map<FrameThemeKey, Promise<HTMLImageElement>>();

function overlayImageUrl(src: string): string {
  return src.startsWith("http")
    ? src
    : `${typeof window !== "undefined" ? window.location.origin : ""}${src}`;
}

export function hasBorderStripTheme(themeKey: FrameThemeKey | null | undefined) {
  return Boolean(themeKey && FRAME_BORDER_STRIPS[themeKey]);
}

export function getFrameBorderWidth(
  themeKey: FrameThemeKey | null | undefined,
  canvasWidth: number
): number {
  const config = themeKey ? FRAME_BORDER_STRIPS[themeKey] : undefined;
  if (!config) return 0;
  return Math.max(56, Math.round(canvasWidth * config.borderWidthRatio));
}

export function getPosterLayout(
  themeKey: FrameThemeKey | null | undefined,
  canvasW: number,
  canvasH: number
): PosterLayoutContext {
  const inset = hasBorderStripTheme(themeKey)
    ? getFrameBorderWidth(themeKey, canvasW)
    : VECTOR_FRAME_INSET;
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

async function loadBorderStripImage(
  key: FrameThemeKey
): Promise<HTMLImageElement | null> {
  const config = FRAME_BORDER_STRIPS[key];
  if (!config) return null;

  let pending = stripCache.get(key);
  if (!pending) {
    pending = loadImage(overlayImageUrl(config.src));
    stripCache.set(key, pending);
  }

  try {
    return await pending;
  } catch {
    stripCache.delete(key);
    return null;
  }
}

function drawStretchVerticalStrip(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  flipX: boolean
) {
  ctx.save();
  if (flipX) {
    ctx.translate(x + width, y);
    ctx.scale(-1, 1);
    ctx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      0,
      0,
      width,
      height
    );
  } else {
    ctx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      x,
      y,
      width,
      height
    );
  }
  ctx.restore();
}

export async function paintFrameBorderStrips(
  ctx: CanvasRenderingContext2D,
  themeKey: FrameThemeKey | null | undefined,
  width: number,
  height: number
) {
  if (!themeKey || !FRAME_BORDER_STRIPS[themeKey]) return;

  const image = await loadBorderStripImage(themeKey);
  if (!image) return;

  const border = getFrameBorderWidth(themeKey, width);
  const prevSmoothing = ctx.imageSmoothingEnabled;
  const prevQuality = ctx.imageSmoothingQuality;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  drawStretchVerticalStrip(ctx, image, 0, 0, border, height, false);
  drawStretchVerticalStrip(ctx, image, width - border, 0, border, height, true);

  ctx.save();
  ctx.translate(0, border);
  ctx.rotate(-Math.PI / 2);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    height,
    border
  );
  ctx.restore();

  ctx.save();
  ctx.translate(width, height - border);
  ctx.rotate(Math.PI / 2);
  ctx.scale(-1, 1);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    height,
    border
  );
  ctx.restore();

  ctx.imageSmoothingEnabled = prevSmoothing;
  ctx.imageSmoothingQuality = prevQuality;
}
