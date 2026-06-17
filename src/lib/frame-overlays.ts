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

export const FRAME_BORDER_STRIPS: Partial<
  Record<FrameThemeKey, FrameBorderStripConfig>
> = {
  "traditional-maharashtrian": {
    src: "/frames/maharashtrian-paithani-border.png",
    borderWidthRatio: 0.095,
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
  return Math.max(44, Math.round(canvasWidth * config.borderWidthRatio));
}

export function getFrameContentInsets(
  themeKey: FrameThemeKey | null | undefined,
  canvasWidth: number,
  canvasHeight: number
): FrameContentInsets {
  const border = getFrameBorderWidth(themeKey, canvasWidth);
  if (!border) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  return { top: border, right: border, bottom: border, left: border };
}

export function getFrameContentBox(
  themeKey: FrameThemeKey | null | undefined,
  canvasWidth: number,
  canvasHeight: number
) {
  const inset = getFrameContentInsets(themeKey, canvasWidth, canvasHeight);
  return {
    x: inset.left,
    y: inset.top,
    w: canvasWidth - inset.left - inset.right,
    h: canvasHeight - inset.top - inset.bottom,
    inset,
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

function tileVerticalStrip(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  flipX: boolean
) {
  const tileHeight = image.naturalHeight * (width / image.naturalWidth);
  let cursorY = y;

  while (cursorY < y + height) {
    const drawHeight = Math.min(tileHeight, y + height - cursorY);
    const sourceHeight = image.naturalHeight * (drawHeight / tileHeight);

    ctx.save();
    if (flipX) {
      ctx.translate(x + width, cursorY);
      ctx.scale(-1, 1);
      ctx.drawImage(
        image,
        0,
        0,
        image.naturalWidth,
        sourceHeight,
        0,
        0,
        width,
        drawHeight
      );
    } else {
      ctx.drawImage(
        image,
        0,
        0,
        image.naturalWidth,
        sourceHeight,
        x,
        cursorY,
        width,
        drawHeight
      );
    }
    ctx.restore();
    cursorY += drawHeight;
  }
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

  tileVerticalStrip(ctx, image, 0, 0, border, height, false);
  tileVerticalStrip(ctx, image, width - border, 0, border, height, true);

  ctx.save();
  ctx.translate(0, border);
  ctx.rotate(-Math.PI / 2);
  tileVerticalStrip(ctx, image, 0, 0, border, width, false);
  ctx.restore();

  ctx.save();
  ctx.translate(width, height - border);
  ctx.rotate(Math.PI / 2);
  tileVerticalStrip(ctx, image, 0, 0, border, width, true);
  ctx.restore();
}

export async function withFrameContentClip(
  ctx: CanvasRenderingContext2D,
  themeKey: FrameThemeKey | null | undefined,
  canvasWidth: number,
  canvasHeight: number,
  draw: () => void | Promise<void>
) {
  if (!hasBorderStripTheme(themeKey)) {
    await draw();
    return;
  }

  const box = getFrameContentBox(themeKey, canvasWidth, canvasHeight);
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  ctx.translate(box.x, box.y);
  ctx.scale(box.w / canvasWidth, box.h / canvasHeight);
  await draw();
  ctx.restore();
}
