import type { ResolvedFrameTheme } from "./frame-themes";
import { getOverlayPhotoSlot } from "./frame-overlays";
import type { PhotoCrop } from "./photo-crop";
import { splitTextIntoLines } from "./canvas-text";
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

  const fontSize = Math.round((slot.fontSize * width) / 1080);
  const x = slot.xRatio * width;
  const y = slot.yRatio * height;
  const maxWidth = slot.maxWidthRatio * width;
  const lineHeight = Math.round(fontSize * 1.15);

  ctx.save();
  ctx.font = posterFont(700, fontSize, theme.paint.type.fontFamily);
  ctx.fillStyle = slot.color;
  ctx.textAlign = slot.align;
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";

  const lines = splitTextIntoLines(ctx, label, maxWidth).slice(0, 2);
  let lineY = y;
  for (const line of lines) {
    ctx.fillText(line, x, lineY, maxWidth);
    lineY += lineHeight;
  }
  ctx.restore();
}
