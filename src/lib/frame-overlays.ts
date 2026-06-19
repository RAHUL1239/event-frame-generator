import type { FrameThemeKey } from "./frame-themes";
import { loadImage } from "./utils";

export type FrameContentInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type FrameHoleShape = "square" | "circle";

export type FrameFullOverlayConfig = {
  src: string;
  /** Transparent hole inset as a fraction of canvas width (square holes). */
  holeInsetRatio?: number;
  /** Transparent hole radius as a fraction of canvas width (circular holes). */
  holeRadiusRatio?: number;
  holeShape?: FrameHoleShape;
  /** Extra inner padding (px at 1080) keeping text away from the frame art. */
  contentPadding?: number;
  /** How closely pixels must match the sampled matte to be removed. */
  chromaTolerance?: number;
  /** Scale overlay when painting (e.g. 1.12 makes the frame band thicker). */
  overlayScale?: number;
  /** Vertical shift as a fraction of canvas height (positive moves overlay down). */
  overlayOffsetY?: number;
};

export type PosterLayoutContext = {
  inset: number;
  innerW: number;
  innerH: number;
  /** Vertical shift matching overlay offset so content aligns with the hole. */
  contentOffsetY?: number;
};

/** Inset used for vector-drawn frames (elegant gold, youth, etc.). */
export const VECTOR_FRAME_INSET = 36;

export const FRAME_FULL_OVERLAYS: Partial<
  Record<FrameThemeKey, FrameFullOverlayConfig>
> = {
  "traditional-maharashtrian": {
    src: "/frames/maharashtrian-frame.jpg",
    holeInsetRatio: 62 / 1080,
    contentPadding: 50,
  },
  "elegant-gold": {
    src: "/frames/elegant-gold-frame.jpg?v=2",
    holeInsetRatio: 82 / 1080,
    contentPadding: 70,
    overlayScale: 1.12,
  },
  "gauravshali-sohla": {
    src: "/frames/gauravshali-sohla-frame.png?v=3",
    holeShape: "circle",
    holeRadiusRatio: 326 / 1024,
    contentPadding: 28,
    overlayScale: 1.14,
    overlayOffsetY: 0.032,
  },
};

const overlayCache = new Map<string, Promise<HTMLImageElement>>();

function overlayCacheKey(key: FrameThemeKey, config: FrameFullOverlayConfig) {
  return `${key}:${config.src}:${config.overlayScale ?? 1}:${config.overlayOffsetY ?? 0}`;
}

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

  if (config.holeShape === "circle" && config.holeRadiusRatio) {
    const scale = config.overlayScale ?? 1;
    const radius = Math.round(canvasWidth * config.holeRadiusRatio * scale);
    return Math.round(canvasWidth / 2 - radius);
  }

  const insetRatio = config.holeInsetRatio ?? 0;
  const base = Math.max(36, Math.round(canvasWidth * insetRatio));
  return Math.round(base * (config.overlayScale ?? 1));
}

function getContentRadius(
  config: FrameFullOverlayConfig,
  canvasWidth: number
): number {
  const extraPadding = Math.round(
    ((config.contentPadding ?? 0) * canvasWidth) / 1080
  );

  if (config.holeShape === "circle" && config.holeRadiusRatio) {
    const scale = config.overlayScale ?? 1;
    const holeRadius = Math.round(canvasWidth * config.holeRadiusRatio * scale);
    return Math.max(120, holeRadius - extraPadding);
  }

  const holeInset = Math.max(
    36,
    Math.round(canvasWidth * (config.holeInsetRatio ?? 0))
  );
  const scaledHole = Math.round(holeInset * (config.overlayScale ?? 1));
  return Math.max(120, canvasWidth / 2 - scaledHole - extraPadding);
}

export function getFrameContentInset(
  themeKey: FrameThemeKey | null | undefined,
  canvasWidth: number
): number {
  if (!hasFrameOverlayTheme(themeKey)) {
    return VECTOR_FRAME_INSET;
  }

  const config = FRAME_FULL_OVERLAYS[themeKey!]!;
  const contentRadius = getContentRadius(config, canvasWidth);
  return Math.round(canvasWidth / 2 - contentRadius);
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
  const config = themeKey ? FRAME_FULL_OVERLAYS[themeKey] : undefined;
  const contentOffsetY = config?.overlayOffsetY
    ? Math.round(config.overlayOffsetY * canvasH)
    : 0;

  return {
    inset,
    innerW: canvasW - inset * 2,
    innerH: canvasH - inset * 2,
    contentOffsetY,
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
  return (
    layout.inset +
    (layout.contentOffsetY ?? 0) +
    (y / canvasH) * layout.innerH
  );
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

  const cacheKey = overlayCacheKey(key, config);
  let pending = overlayCache.get(cacheKey);
  if (!pending) {
    pending = prepareOverlayWithHole(key, config);
    overlayCache.set(cacheKey, pending);
  }

  try {
    return await pending;
  } catch {
    overlayCache.delete(cacheKey);
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

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error(`Failed to prepare frame overlay for ${key}`);
  }

  ctx.drawImage(source, 0, 0);
  if (config.chromaTolerance != null) {
    removeFrameMatte(ctx, width, height, config.chromaTolerance);
  }

  if (config.holeShape === "circle" && config.holeRadiusRatio) {
    clearCircularHole(ctx, width, height, config.holeRadiusRatio);
  } else {
    const inset = Math.round(width * (config.holeInsetRatio ?? 0));
    ctx.clearRect(inset, inset, width - inset * 2, height - inset * 2);
  }

  return loadImage(canvas.toDataURL("image/png"));
}

function clearCircularHole(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radiusRatio: number
) {
  const radius = width * radiusRatio;
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function sampleMatteColor(
  data: Uint8ClampedArray,
  width: number,
  height: number
) {
  const points: Array<[number, number]> = [
    [4, 4],
    [width - 5, 4],
    [4, height - 5],
    [width - 5, height - 5],
    [Math.floor(width / 2), 4],
    [Math.floor(width / 2), height - 5],
    [4, Math.floor(height / 2)],
    [width - 5, Math.floor(height / 2)],
  ];

  let r = 0;
  let g = 0;
  let b = 0;

  for (const [x, y] of points) {
    const i = (y * width + x) * 4;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }

  const count = points.length;
  return { r: r / count, g: g / count, b: b / count };
}

function isOrnamentPixel(r: number, g: number, b: number) {
  if (r > 118 && g > 88 && r >= b + 22) return true;
  if (r > 175 && g > 145 && b > 75) return true;
  if (r > 78 && g > 58 && r > b + 12 && r + g > 155) return true;
  return false;
}

function shouldRemoveMattePixel(
  r: number,
  g: number,
  b: number,
  matte: { r: number; g: number; b: number },
  tolerance: number
) {
  if (isOrnamentPixel(r, g, b)) return false;

  const distance = Math.hypot(r - matte.r, g - matte.g, b - matte.b);
  if (distance <= tolerance) return true;

  if (r < 55 && g < 55 && b < 55) return true;

  if (r > 55 && r < 135 && g < 55 && b < 55) return true;

  return false;
}

function removeFrameMatte(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tolerance: number
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  const matte = sampleMatteColor(data, width, height);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (shouldRemoveMattePixel(r, g, b, matte, tolerance)) {
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
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

  const config = FRAME_FULL_OVERLAYS[themeKey]!;
  const scale = config.overlayScale ?? 1;
  const offsetY = (config.overlayOffsetY ?? 0) * height;

  const prevSmoothing = ctx.imageSmoothingEnabled;
  const prevQuality = ctx.imageSmoothingQuality;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (scale === 1 && offsetY === 0) {
    ctx.drawImage(image, 0, 0, width, height);
  } else if (scale === 1) {
    ctx.drawImage(image, 0, offsetY, width, height);
  } else {
    const scaledW = width * scale;
    const scaledH = height * scale;
    ctx.drawImage(
      image,
      (width - scaledW) / 2,
      (height - scaledH) / 2 + offsetY,
      scaledW,
      scaledH
    );
  }

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
