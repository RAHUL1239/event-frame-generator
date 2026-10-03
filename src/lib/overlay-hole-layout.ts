import type { ResolvedFrameTheme } from "./frame-themes";
import { getOverlayPhotoSlot } from "./frame-overlays";
import type { PhotoCrop } from "./photo-crop";
import {
  fillTextWithSpaces,
  measureLineWidth,
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

function resolveOverlayCopyBox(
  theme: ResolvedFrameTheme,
  width: number,
  height: number
) {
  const slot = theme.paint.overlayName;
  if (!slot) return null;

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

  return {
    slot,
    x,
    maxWidth,
    startY: slot.yRatio * height,
    maxBottom: (slot.maxBottomRatio ?? 0.7) * height,
    align: slot.align,
  };
}

type OverlayLine = {
  text: string;
  kind: "name" | "tagline";
};

function layoutOverlayCopyLines(
  ctx: CanvasRenderingContext2D,
  name: string,
  taglines: string[],
  maxWidth: number,
  nameFont: string,
  tagFont: string
): OverlayLine[] {
  const lines: OverlayLine[] = [];
  const label = name.trim().toUpperCase();
  if (label) {
    ctx.font = nameFont;
    for (const line of splitTextIntoLines(ctx, label, maxWidth).slice(0, 2)) {
      lines.push({ text: line, kind: "name" });
    }
  }
  ctx.font = tagFont;
  for (const tag of taglines.map((t) => t.trim()).filter(Boolean)) {
    const wrapped = splitTextIntoLines(ctx, tag, maxWidth).slice(0, 3);
    for (const line of wrapped) {
      lines.push({ text: line, kind: "tagline" });
    }
  }
  return lines;
}

function overlayCopyHeight(
  lines: OverlayLine[],
  nameSize: number,
  tagSize: number
): number {
  let height = 0;
  for (const line of lines) {
    height += line.kind === "name" ? Math.round(nameSize * 1.15) : Math.round(tagSize * 1.28);
  }
  return height;
}

/**
 * Name and event taglines painted after the full-bleed PNG, in the empty
 * column beside the photo hole and above the artwork divider.
 */
export function drawOverlayHoleCopy(
  ctx: CanvasRenderingContext2D,
  theme: ResolvedFrameTheme,
  name: string,
  taglines: string[],
  width: number,
  height: number
) {
  const box = resolveOverlayCopyBox(theme, width, height);
  const label = name.trim();
  const activeTaglines = taglines.map((t) => t.trim()).filter(Boolean);
  if (!box || (!label && activeTaglines.length === 0)) return;

  const slot = box.slot;
  let nameSize = Math.round((slot.fontSize * width) / 1080);
  let tagSize = Math.round(
    ((slot.taglineSize ?? theme.paint.type.personalTaglineSize) * width) / 1080
  );
  const nameColor = slot.color;
  const taglineColor = slot.taglineColor ?? theme.paint.posterTextColor;
  const fontFamily = theme.paint.type.fontFamily;
  const maxStack = Math.max(48, box.maxBottom - box.startY + nameSize * 0.25);

  let nameFont = posterFont(700, nameSize, fontFamily);
  let tagFont = posterFont(600, tagSize, fontFamily);
  let lines = layoutOverlayCopyLines(
    ctx,
    label,
    activeTaglines,
    box.maxWidth,
    nameFont,
    tagFont
  );

  while (
    overlayCopyHeight(lines, nameSize, tagSize) > maxStack &&
    (nameSize > 22 || tagSize > 14)
  ) {
    if (tagSize > 14) tagSize -= 1;
    if (nameSize > 22 && nameSize > tagSize + 10) nameSize -= 1;
    nameFont = posterFont(700, nameSize, fontFamily);
    tagFont = posterFont(600, tagSize, fontFamily);
    lines = layoutOverlayCopyLines(
      ctx,
      label,
      activeTaglines,
      box.maxWidth,
      nameFont,
      tagFont
    );
  }

  while (overlayCopyHeight(lines, nameSize, tagSize) > maxStack && lines.length > 1) {
    let lastName = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].kind === "name") lastName = i;
    }
    if (lines.length - 1 > lastName) lines.pop();
    else break;
  }

  let blockWidth = 0;
  for (const line of lines) {
    ctx.font = line.kind === "name" ? nameFont : tagFont;
    blockWidth = Math.max(blockWidth, measureLineWidth(ctx, line.text));
  }
  blockWidth = Math.min(box.maxWidth, blockWidth);

  const stackH = overlayCopyHeight(lines, nameSize, tagSize);
  const padX = Math.round(12 * (width / 1080));
  const padY = Math.round(10 * (width / 1080));
  const matteX =
    box.align === "center" ? box.x - blockWidth / 2 - padX : box.x - padX;
  const matteY = box.startY - nameSize * 0.82 - padY;
  const matteW = blockWidth + padX * 2;
  const matteH = stackH + padY * 2;

  ctx.save();
  ctx.fillStyle = theme.colors.background;
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  const radius = Math.round(12 * (width / 1080));
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(matteX, matteY, matteW, matteH, radius);
  } else {
    ctx.rect(matteX, matteY, matteW, matteH);
  }
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.textAlign = box.align;
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.shadowColor = "rgba(255, 255, 255, 0.7)";
  ctx.shadowBlur = Math.round(4 * (width / 1080));

  let lineY = box.startY;
  for (const line of lines) {
    const isName = line.kind === "name";
    ctx.font = isName ? nameFont : tagFont;
    ctx.fillStyle = isName ? nameColor : taglineColor;
    fillTextWithSpaces(ctx, line.text, box.x, lineY, box.maxWidth);
    lineY += isName ? Math.round(nameSize * 1.15) : Math.round(tagSize * 1.28);
  }
  ctx.restore();
}

/** @deprecated Use drawOverlayHoleCopy so taglines paint with the name. */
export function drawOverlayHoleName(
  ctx: CanvasRenderingContext2D,
  theme: ResolvedFrameTheme,
  name: string,
  width: number,
  height: number
) {
  drawOverlayHoleCopy(ctx, theme, name, [], width, height);
}
