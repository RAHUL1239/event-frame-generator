import type { EventWithOptions } from "./types";
import type { ResolvedFrameTheme } from "./frame-themes";
import {
  layoutScale,
  layoutX,
  layoutY,
  type PosterLayoutContext,
} from "./frame-overlays";
import {
  parsePosterTemplate,
  getPosterTicketUrl,
  getPosterVenueBarLine,
  resolvePosterStats,
  type PosterStat,
} from "./poster-template";
import { parseEventHighlights } from "./event-highlights";
import { splitTextIntoLines } from "./canvas-text";
import { posterFont } from "./poster-fonts";
import { drawLogoAt } from "./utils";
import { resolvePosterColor } from "./poster-template";
import { getEventQrUrl, loadQrCodeImage } from "./qr-code";

export const GS_THEME_KEY = "gauravshali-sohla" as const;

export const GS_COLORS = {
  navy: "#1A2B56",
  orange: "#E85D33",
  cream: "#FFF9F0",
  creamWarm: "#F8E8DF",
  teal: "#1B827E",
  gold: "#D4AF37",
  venueBar: "#E8EEF4",
  textureLine: "rgba(196, 154, 88, 0.32)",
  textureDot: "rgba(196, 154, 88, 0.48)",
};

export function paintGsBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const scale = Math.min(width, height) / 1080;
  const spacing = Math.max(24, Math.round(34 * scale));
  const lineWidth = Math.max(0.75, 1 * scale);
  const dotRadius = Math.max(1.4, 2.1 * scale);

  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, "#FFF0E8");
  gradient.addColorStop(0.35, "#FFF6EF");
  gradient.addColorStop(0.55, GS_COLORS.cream);
  gradient.addColorStop(1, GS_COLORS.creamWarm);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = GS_COLORS.textureLine;
  ctx.beginPath();
  for (let startX = -height; startX <= width + height; startX += spacing) {
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX + height, height);
  }
  ctx.stroke();

  ctx.fillStyle = GS_COLORS.textureDot;
  for (let startX = -height; startX <= width + height; startX += spacing) {
    if (startX >= 0 && startX <= width) {
      ctx.beginPath();
      ctx.arc(startX, 0, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Soft peach/salmon glow behind the attendee photo area. */
export function paintGsPhotoWarmAccent(
  ctx: CanvasRenderingContext2D,
  photoX: number,
  photoY: number,
  photoRadius: number,
  ringOuterInset: number,
  fontScale = 1
) {
  const outerRadius = photoRadius + ringOuterInset + Math.round(52 * fontScale);
  const gradient = ctx.createRadialGradient(
    photoX,
    photoY,
    photoRadius * 0.15,
    photoX,
    photoY,
    outerRadius
  );
  gradient.addColorStop(0, "rgba(235, 145, 108, 0.42)");
  gradient.addColorStop(0.5, "rgba(245, 186, 158, 0.28)");
  gradient.addColorStop(1, "rgba(255, 249, 240, 0)");

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(photoX, photoY, outerRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Warm glow behind a row/cluster of group photos. */
export function paintGsGroupPhotosWarmAccent(
  ctx: CanvasRenderingContext2D,
  positions: { x: number; y: number; r: number }[],
  ringOuterInset: number,
  fontScale = 1
) {
  if (positions.length === 0) return;

  const centerX =
    positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
  const centerY =
    positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;
  const maxReach = Math.max(
    ...positions.map((pos) => {
      const dx = pos.x - centerX;
      const dy = pos.y - centerY;
      return Math.hypot(dx, dy) + pos.r + ringOuterInset;
    })
  );
  const outerRadius = maxReach + Math.round(36 * fontScale);

  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    maxReach * 0.1,
    centerX,
    centerY,
    outerRadius
  );
  gradient.addColorStop(0, "rgba(235, 145, 108, 0.4)");
  gradient.addColorStop(0.5, "rgba(245, 186, 158, 0.26)");
  gradient.addColorStop(1, "rgba(255, 249, 240, 0)");

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function isGsTheme(theme: ResolvedFrameTheme): boolean {
  return (theme.overlayKey ?? theme.key) === GS_THEME_KEY;
}

function scaleCoord(value: number, canvasW: number, designW: number): number {
  return (value * canvasW) / designW;
}

function scaleCoordY(value: number, canvasH: number, designH: number): number {
  return (value * canvasH) / designH;
}

export function drawGsCompactHeader(
  ctx: CanvasRenderingContext2D,
  event: EventWithOptions,
  logo: HTMLImageElement,
  theme: ResolvedFrameTheme,
  layout: PosterLayoutContext,
  canvasW: number,
  canvasH: number,
  hashtag?: string,
  fontScale = 1,
  designW = 1080,
  designH = 1080
): number {
  const topY = layoutY(layout, scaleCoordY(22, canvasH, designH), canvasH);
  const logoX = Math.round(12 * fontScale);
  const logoSize = Math.round(101 * fontScale);
  const logoY = topY - Math.round(20 * fontScale);

  const { width: logoW, height: logoH } = drawLogoAt(
    ctx,
    logo,
    logoX,
    logoY,
    logoSize,
    logoSize
  );

  const textX = logoX + logoW + Math.round(14 * fontScale);
  const textMaxW =
    layoutX(layout, scaleCoord(canvasW - 160, canvasW, designW), canvasW) - textX;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";

  ctx.fillStyle = GS_COLORS.navy;
  ctx.font = posterFont(700, Math.round(32 * fontScale));
  const nameLines = splitTextIntoLines(ctx, event.name.toUpperCase(), textMaxW);
  let lineY = topY + Math.round(22 * fontScale);
  for (const line of nameLines) {
    ctx.fillText(line, textX, lineY);
    lineY += Math.round(28 * fontScale);
  }

  ctx.fillStyle = GS_COLORS.orange;
  ctx.font = posterFont(600, Math.round(29 * fontScale));
  const dateY = lineY + Math.round(6 * fontScale);
  ctx.fillText(event.dateLabel.toUpperCase(), textX, dateY);

  if (hashtag) {
    ctx.textAlign = "right";
    ctx.fillStyle = GS_COLORS.teal;
    ctx.font = posterFont(700, Math.round(37 * fontScale));
    const tagX = layoutX(
      layout,
      scaleCoord(canvasW - 36, canvasW, designW),
      canvasW
    );
    ctx.fillText(hashtag, tagX, topY + Math.round(32 * fontScale));
  }

  return Math.max(logoY + logoH, dateY + Math.round(18 * fontScale)) + Math.round(10 * fontScale);
}

export function drawGsHeadlineTagline(
  ctx: CanvasRenderingContext2D,
  tagline: string,
  x: number,
  y: number,
  maxWidth: number,
  fontScale = 1,
  centerX?: number
): number {
  if (!tagline.trim()) return y;

  const lineW = Math.min(maxWidth, 280 * fontScale);
  const lineStart = centerX != null ? centerX - lineW / 2 : x;

  ctx.strokeStyle = GS_COLORS.orange;
  ctx.lineWidth = Math.max(1, Math.round(2 * fontScale));
  ctx.beginPath();
  ctx.moveTo(lineStart, y);
  ctx.lineTo(lineStart + lineW, y);
  ctx.stroke();

  ctx.fillStyle = GS_COLORS.orange;
  ctx.textAlign = centerX != null ? "center" : "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = posterFont(600, Math.round(30 * fontScale));
  const lines = splitTextIntoLines(ctx, tagline, maxWidth);
  let lineY = y + Math.round(34 * fontScale);
  const textX = centerX ?? x;
  for (const line of lines) {
    ctx.fillText(line, textX, lineY);
    lineY += Math.round(36 * fontScale);
  }
  return lineY;
}

export function drawGsVenueBar(
  ctx: CanvasRenderingContext2D,
  venueLine: string,
  y: number,
  layout: PosterLayoutContext,
  canvasW: number,
  fontScale = 1,
  designW = 1080
): number {
  return drawGsVenueQrBar(ctx, venueLine, null, y, layout, canvasW, fontScale, designW);
}

/** Venue text and optional QR code in one light bar, sized to fit the QR. */
function gsFooterBarBounds(canvasW: number): { barX: number; barW: number } {
  return { barX: 0, barW: canvasW };
}

const GS_FOOTER_BAR_DESIGN_H = 68;

type GsSocialPlatform = "instagram" | "facebook" | "youtube";

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawGsSocialIconCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  platform: GsSocialPlatform
) {
  ctx.save();

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  const color = GS_COLORS.navy;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.2, radius * 0.13);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const s = radius * 0.5;

  switch (platform) {
    case "instagram": {
      const size = s * 1.35;
      const left = cx - size / 2;
      const top = cy - size / 2;
      ctx.beginPath();
      roundRectPath(ctx, left, top, size, size, size * 0.28);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + s * 0.36, cy - s * 0.36, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "facebook": {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = posterFont(700, Math.round(radius * 1.4));
      ctx.fillText("f", cx, cy + radius * 0.05);
      break;
    }
    case "youtube": {
      const w = s * 1.55;
      const h = s * 1.08;
      const left = cx - w / 2;
      const top = cy - h / 2;
      ctx.beginPath();
      roundRectPath(ctx, left, top, w, h, s * 0.24);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.14, cy - s * 0.4);
      ctx.lineTo(cx + s * 0.46, cy);
      ctx.lineTo(cx - s * 0.14, cy + s * 0.4);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

const GS_FOOTER_SOCIAL_PLATFORMS: GsSocialPlatform[] = [
  "instagram",
  "facebook",
  "youtube",
];

function drawGsFooterSocialIcons(
  ctx: CanvasRenderingContext2D,
  barX: number,
  barW: number,
  centerY: number,
  barHeight: number,
  socialHandle: string | undefined,
  fontScale: number
) {
  const iconRadius = Math.round(
    Math.min(22 * fontScale, barHeight / 2 - Math.round(8 * fontScale))
  );
  const iconGap = Math.round(12 * fontScale);
  const edgePad = Math.round(18 * fontScale);
  let cursorX = barX + barW - edgePad;

  if (socialHandle?.trim()) {
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = GS_COLORS.gold;
    ctx.font = posterFont(600, Math.round(24 * fontScale));
    ctx.fillText(socialHandle.trim(), cursorX, centerY);
    cursorX -= ctx.measureText(socialHandle.trim()).width + iconGap * 1.5;
  }

  for (let i = GS_FOOTER_SOCIAL_PLATFORMS.length - 1; i >= 0; i--) {
    drawGsSocialIconCircle(
      ctx,
      cursorX - iconRadius,
      centerY,
      iconRadius,
      GS_FOOTER_SOCIAL_PLATFORMS[i]
    );
    cursorX -= iconRadius * 2 + iconGap;
  }
}

export function drawGsVenueQrBar(
  ctx: CanvasRenderingContext2D,
  venueLine: string,
  qrImage: HTMLImageElement | null,
  y: number,
  layout: PosterLayoutContext,
  canvasW: number,
  fontScale = 1,
  designW = 1080
): number {
  const { barX, barW } = gsFooterBarBounds(canvasW);
  const qrSize = Math.round(58 * fontScale);
  const qrPad = Math.round(7 * fontScale);
  const qrBoxSize = qrSize + qrPad * 2;
  const barH = qrImage ? Math.round(72 * fontScale) : Math.round(48 * fontScale);

  ctx.fillStyle = GS_COLORS.venueBar;
  ctx.fillRect(barX, y, barW, barH);

  const textPadX = Math.round(18 * fontScale);
  const qrRightInset = Math.round(24 * fontScale);

  if (qrImage) {
    const qrX = barX + barW - qrBoxSize - qrRightInset;
    const qrY = y + (barH - qrBoxSize) / 2;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(qrX, qrY, qrBoxSize, qrBoxSize);
    ctx.strokeStyle = "rgba(26, 43, 86, 0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX + 0.5, qrY + 0.5, qrBoxSize - 1, qrBoxSize - 1);
    ctx.drawImage(qrImage, qrX + qrPad, qrY + qrPad, qrSize, qrSize);
  }

  const trimmedVenue = venueLine.trim();
  if (trimmedVenue) {
    const qrReserve = qrImage ? qrBoxSize + qrRightInset : 0;
    const textAreaW = barW - qrReserve;
    const textCenterX = barX + textAreaW / 2;
    const textMaxWForCenter = textAreaW - textPadX * 2;

    ctx.fillStyle = GS_COLORS.navy;
    ctx.textAlign = "center";
    ctx.direction = "ltr";
    const fontSize = Math.round(28 * fontScale);
    ctx.font = posterFont(700, fontSize);
    const lines = splitTextIntoLines(ctx, trimmedVenue, textMaxWForCenter);
    const lineHeight = Math.round(32 * fontScale);
    const barCenterY = y + barH / 2;

    ctx.textBaseline = "alphabetic";
    if (lines.length === 1) {
      const metrics = ctx.measureText(lines[0]);
      const ascent = metrics.actualBoundingBoxAscent ?? fontSize * 0.78;
      const descent = metrics.actualBoundingBoxDescent ?? fontSize * 0.22;
      const baseline = barCenterY + (ascent - descent) / 2;
      ctx.fillText(lines[0], textCenterX, baseline);
    } else {
      const firstMetrics = ctx.measureText(lines[0]);
      const ascent = firstMetrics.actualBoundingBoxAscent ?? fontSize * 0.78;
      const blockHeight = (lines.length - 1) * lineHeight + ascent;
      let baseline = barCenterY - blockHeight / 2 + ascent;
      for (const line of lines) {
        ctx.fillText(line, textCenterX, baseline);
        baseline += lineHeight;
      }
    }
  }

  return y + barH;
}

export function drawGsStatsBar(
  ctx: CanvasRenderingContext2D,
  stats: PosterStat[],
  y: number,
  theme: ResolvedFrameTheme,
  layout: PosterLayoutContext,
  canvasW: number,
  designW = 1080
): number {
  const barH = 118;
  const { barX, barW } = gsFooterBarBounds(canvasW);
  const blockW = barW / stats.length;
  const { primary, accent, gold, green } = theme.colors;

  stats.forEach((stat, i) => {
    const x = barX + i * blockW;
    const color = resolvePosterColor(stat.color, primary, accent, gold, green);

    ctx.fillStyle = color;
    ctx.fillRect(x, y, blockW, barH);

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.direction = "ltr";
    ctx.fillStyle = "#ffffff";
    ctx.font = posterFont(700, 34);
    ctx.fillText(stat.value, x + blockW / 2, y + 52);
    ctx.font = posterFont(500, 16);
    const labelLines = splitTextIntoLines(ctx, stat.label, blockW - 12);
    let labelY = y + 82;
    for (const line of labelLines.slice(0, 2)) {
      ctx.fillText(line, x + blockW / 2, labelY);
      labelY += 18;
    }
  });

  return y + barH;
}

export function drawGsFooterBar(
  ctx: CanvasRenderingContext2D,
  y: number,
  height: number,
  layout: PosterLayoutContext,
  canvasW: number,
  ticketUrl?: string,
  website?: string,
  socialHandle?: string,
  designW = 1080,
  fontScale = 1
) {
  const { barX, barW } = gsFooterBarBounds(canvasW);
  const centerY = y + height / 2;

  ctx.fillStyle = GS_COLORS.navy;
  ctx.fillRect(barX, y, barW, height);

  const ticketLabel = ticketUrl
    ? ticketUrl.replace(/^https?:\/\//i, "").replace(/\/$/, "")
    : website?.replace(/^https?:\/\//i, "");

  ctx.textBaseline = "middle";
  ctx.direction = "ltr";

  if (ticketLabel) {
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = posterFont(600, Math.round(24 * fontScale));
    ctx.fillText(`🌐 ${ticketLabel}`, barX + Math.round(18 * fontScale), centerY);
  }

  drawGsFooterSocialIcons(
    ctx,
    barX,
    barW,
    centerY,
    height,
    socialHandle,
    fontScale
  );
}

export async function drawGsPosterFooter(
  ctx: CanvasRenderingContext2D,
  event: EventWithOptions,
  theme: ResolvedFrameTheme,
  _middleEndY: number,
  layout: PosterLayoutContext,
  canvasW: number,
  canvasH: number,
  fontScale = 1,
  designW = 1080,
  _designH = 1080,
  page: "personal" | "group" = "personal",
  attendeeCount?: number
) {
  const config = parsePosterTemplate(event);
  const stats = resolvePosterStats(config.stats ?? [], attendeeCount);
  const highlights = parseEventHighlights(event.eventHighlights);
  const venueLine = getPosterVenueBarLine(config, event, highlights) ?? "";
  const ticketUrl = getPosterTicketUrl(config);

  const qrUrl =
    config.qrUrl?.trim() ||
    ticketUrl ||
    getEventQrUrl(event, page, config.qrUrl);
  const qrImage = qrUrl
    ? await loadQrCodeImage(qrUrl, Math.round(58 * fontScale))
    : null;

  const footerH = Math.round(GS_FOOTER_BAR_DESIGN_H * fontScale);
  const statsH = stats.length > 0 ? 118 : 0;
  const hasVenueRow = Boolean(venueLine.trim()) || qrImage != null;
  const venueQrH = hasVenueRow
    ? qrImage
      ? Math.round(72 * fontScale)
      : Math.round(48 * fontScale)
    : 0;
  const sectionGap = 4;

  const footerTop = canvasH - layout.inset - footerH - 6;

  drawGsFooterBar(
    ctx,
    footerTop,
    footerH,
    layout,
    canvasW,
    ticketUrl,
    config.website,
    config.socialHandle,
    designW,
    fontScale
  );

  let stackBottom = footerTop - sectionGap;

  if (stats.length > 0) {
    stackBottom -= statsH;
    drawGsStatsBar(ctx, stats, stackBottom, theme, layout, canvasW, designW);
  }

  if (hasVenueRow) {
    const venueY = stackBottom - (stats.length > 0 ? sectionGap : 0) - venueQrH;
    drawGsVenueQrBar(
      ctx,
      venueLine,
      qrImage,
      venueY,
      layout,
      canvasW,
      fontScale,
      designW
    );
  }
}

export function drawGsPhotoRings(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  photoRadius: number,
  fontScale = 1
) {
  const innerInset = Math.round(6 * fontScale);
  const innerWidth = Math.max(8, Math.round(10 * fontScale));
  const outerWidth = Math.max(6, Math.round(8 * fontScale));
  const ringGap = Math.round(5 * fontScale);
  const innerRadius = photoRadius + innerInset;
  const outerRadius = innerRadius + innerWidth / 2 + ringGap + outerWidth / 2;

  ctx.save();
  ctx.lineCap = "round";

  ctx.strokeStyle = GS_COLORS.gold;
  ctx.lineWidth = innerWidth;
  ctx.beginPath();
  ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = GS_COLORS.orange;
  ctx.lineWidth = outerWidth;
  ctx.beginPath();
  ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}
