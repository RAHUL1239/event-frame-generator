import type { ResolvedFrameTheme } from "./frame-themes";
import { getOverlayPhotoSlot } from "./frame-overlays";
import type { PhotoCrop } from "./photo-crop";
import {
  fillTextWithSpaces,
  splitTextIntoLines,
} from "./canvas-text";
import { posterFont } from "./poster-fonts";
import { drawCircularImage, drawRoundedRectImage } from "./utils";

export function isOverlayHoleLayout(theme: ResolvedFrameTheme): boolean {
  return theme.paint.layout === "overlay-hole";
}

export function drawOverlayHolePhoto(
  ctx: CanvasRenderingContext2D,
  theme: ResolvedFrameTheme,
  photo: HTMLImageElement | undefined,
  crop: PhotoCrop | undefined,
  width: number,
  height: number
) {
  const hole = getOverlayPhotoSlot(theme.overlayKey ?? theme.key, width, height);
  if (!hole || !photo) return hole;
  if (hole.shape === "rounded-rect") {
    drawRoundedRectImage(
      ctx,
      photo,
      hole.x,
      hole.y,
      hole.width,
      hole.height,
      hole.radius,
      crop
    );
    return hole;
  }
  drawCircularImage(ctx, photo, hole.x, hole.y, hole.radius, crop);
  return hole;
}

function overlayHoleRight(
  theme: ResolvedFrameTheme,
  width: number,
  height: number
): number {
  const hole = getOverlayPhotoSlot(theme.overlayKey ?? theme.key, width, height);
  if (!hole) return 0;
  if (hole.shape === "rounded-rect") return hole.x + hole.width;
  return hole.x + hole.radius;
}

/**
 * Guest name only. Taglines are painted from each theme's paint.tagline slot.
 */
export function drawOverlayHoleName(
  ctx: CanvasRenderingContext2D,
  theme: ResolvedFrameTheme,
  name: string,
  width: number,
  height: number
) {
  const slot = theme.paint.overlayName;
  const label = name.trim();
  if (!slot || !label) return;

  const holePad = Math.round(0.028 * width);
  const minX = overlayHoleRight(theme, width, height) + holePad;
  const maxRight = width - Math.round(0.04 * width);

  let x = slot.xRatio * width;
  let maxWidth = slot.maxWidthRatio * width;
  if (slot.align === "left" && x < minX) {
    maxWidth -= minX - x;
    x = minX;
  }
  maxWidth = Math.max(80, Math.min(maxWidth, maxRight - x));

  const startY = slot.yRatio * height;
  const maxBottom = (slot.maxBottomRatio ?? 0.7) * height;
  let size = Math.round((slot.fontSize * width) / 1080);
  const fontFamily = theme.paint.type.fontFamily;
  const upper = label.toUpperCase();

  ctx.save();
  ctx.textAlign = slot.align;
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = slot.color;

  let font = posterFont(700, size, fontFamily);
  ctx.font = font;
  let lines = splitTextIntoLines(ctx, upper, maxWidth).slice(0, 2);
  const lineH = () => Math.round(size * 1.15);

  while (lines.length * lineH() > maxBottom - startY + size * 0.25 && size > 22) {
    size -= 1;
    font = posterFont(700, size, fontFamily);
    ctx.font = font;
    lines = splitTextIntoLines(ctx, upper, maxWidth).slice(0, 2);
  }

  let lineY = startY;
  ctx.font = font;
  for (const line of lines) {
    if (lineY > maxBottom) break;
    fillTextWithSpaces(ctx, line, x, lineY, maxWidth);
    lineY += lineH();
  }
  ctx.restore();
}
