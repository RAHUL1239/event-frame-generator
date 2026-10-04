import type { ResolvedFrameTheme } from "../frame-themes";
import {
  fillTextWithSpaces,
  splitTextIntoLines,
} from "../canvas-text";
import { posterFont } from "../poster-fonts";
import type { FrameTaglinePaint } from "./types";

export function defaultClassicTagline(
  color: string,
  overrides: Partial<FrameTaglinePaint> = {}
): FrameTaglinePaint {
  return {
    align: "left",
    color,
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 38,
    afterNameGap: 20,
    ...overrides,
    placement: overrides.placement ?? "after-name",
  };
}

/**
 * Overlay-frame taglines only. Reads each theme's slot — no shared
 * right-hand column or cream matte unless that theme sets a cover.
 */
export function drawPaintedTaglines(
  ctx: CanvasRenderingContext2D,
  theme: ResolvedFrameTheme,
  taglines: string[],
  width: number,
  height: number
) {
  const slot = theme.paint.tagline;
  if (!slot || slot.placement !== "slot") return;

  const active = taglines.map((t) => t.trim()).filter(Boolean);
  if (active.length === 0 && !slot.cover) return;

  if (slot.cover) {
    ctx.save();
    ctx.fillStyle = slot.cover.color;
    ctx.fillRect(
      slot.cover.xRatio * width,
      slot.cover.yRatio * height,
      slot.cover.widthRatio * width,
      slot.cover.heightRatio * height
    );
    ctx.restore();
  }

  if (active.length === 0) return;

  const x = (slot.xRatio ?? 0.58) * width;
  const maxWidth = Math.max(80, (slot.maxWidthRatio ?? 0.36) * width);
  const startY = (slot.yRatio ?? 0.55) * height;
  const maxBottom = (slot.maxBottomRatio ?? 0.7) * height;
  const size = Math.round((slot.fontSize * width) / 1080);
  const lineH = Math.round(((slot.lineHeight ?? slot.fontSize + 6) * width) / 1080);
  const font = posterFont(slot.fontWeight, size, theme.paint.type.fontFamily);

  ctx.save();
  ctx.textAlign = slot.align;
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = slot.color;
  ctx.font = font;

  let lineY = startY;
  for (const tag of active) {
    const wrapped = splitTextIntoLines(ctx, tag, maxWidth).slice(0, 3);
    for (const line of wrapped) {
      if (lineY > maxBottom) break;
      fillTextWithSpaces(ctx, line, x, lineY, maxWidth);
      lineY += lineH;
    }
    if (lineY > maxBottom) break;
  }
  ctx.restore();
}
