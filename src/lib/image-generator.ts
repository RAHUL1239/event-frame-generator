import type { EventWithOptions, GeneratedAssets, GroupFormData, PersonalFormData } from "./types";
import {
  drawFrameThemeDecoration,
  resolveFrameTheme,
  type ResolvedFrameTheme,
} from "./frame-themes";
import {
  getPosterLayout,
  hasFrameOverlayTheme,
  layoutScale,
  layoutX,
  layoutY,
  paintFrameFullOverlay,
  type PosterLayoutContext,
} from "./frame-overlays";
import { getEventCountdown } from "./countdown";
import { parseEventHighlights } from "./event-highlights";
import {
  getPosterHashtag,
  getPosterHeadline,
  getPosterVenueLine,
  parsePosterTemplate,
  resolvePosterColor,
  type PosterStat,
} from "./poster-template";
import { loadQrCodeImage, getEventQrUrl } from "./qr-code";
import {
  drawCircularImage,
  drawLogo,
  fileToDataUrl,
  loadEventLogo,
  loadImage,
} from "./utils";
import {
  fillCenteredLine,
  splitTextIntoLines,
  wrapCanvasText,
} from "./canvas-text";
import { ensurePosterFontsLoaded, posterFont } from "./poster-fonts";

type PersonalInput = PersonalFormData & { event: EventWithOptions };
type GroupInput = GroupFormData & { event: EventWithOptions };

const POSTER_W = 1080;
const POSTER_H = 1080;

export type PersonalPosterRenderInput = Omit<PersonalFormData, "photo"> & {
  event: EventWithOptions;
};

export type GroupPosterRenderInput = Omit<GroupFormData, "photos" | "members"> & {
  event: EventWithOptions;
};

export const PERSONAL_POSTER_W = POSTER_W;
export const PERSONAL_POSTER_H = POSTER_H;
export const PERSONAL_PHOTO_POSITION = {
  x: POSTER_W / 2,
  y: 340,
  radius: 120,
  ringPadding: 6,
};

const DP_W = 640;
const DP_H = 640;

export const PERSONAL_DP_W = DP_W;
export const PERSONAL_DP_H = DP_H;
export const PERSONAL_DP_PHOTO_POSITION = {
  x: Math.round((PERSONAL_PHOTO_POSITION.x * DP_W) / POSTER_W),
  y: Math.round((PERSONAL_PHOTO_POSITION.y * DP_H) / POSTER_H),
  radius: Math.round((PERSONAL_PHOTO_POSITION.radius * DP_W) / POSTER_W),
  ringPadding: Math.round((PERSONAL_PHOTO_POSITION.ringPadding * DP_W) / POSTER_W),
};

export type PersonalDpRenderInput = PersonalPosterRenderInput;
export type GroupDpRenderInput = GroupPosterRenderInput;

function getGenderTagline(event: EventWithOptions, genderKey: string) {
  return event.genderOptions.find((o) => o.key === genderKey)?.tagline ?? "";
}

function resolveFrameBackground(theme: ResolvedFrameTheme): string {
  return theme.colors.primary;
}

function paintFrameBackground(
  ctx: CanvasRenderingContext2D,
  theme: ResolvedFrameTheme,
  width: number,
  height: number
) {
  ctx.fillStyle = resolveFrameBackground(theme);
  ctx.fillRect(0, 0, width, height);
}

async function paintFrameOverlay(
  ctx: CanvasRenderingContext2D,
  theme: ResolvedFrameTheme,
  width: number,
  height: number
) {
  const themeKey = theme.overlayKey ?? theme.key;
  if (hasFrameOverlayTheme(themeKey)) {
    await paintFrameFullOverlay(ctx, themeKey, width, height);
    return;
  }

  drawFrameThemeDecoration(ctx, theme, width, height, {
    onDarkBackground: true,
    skipWhenOverlay: Boolean(theme.overlayKey),
  });
}

const DEFAULT_POSTER_TEXT = "#ffffff";

function getPosterTextColor(theme: ResolvedFrameTheme): string {
  return theme.posterTextColor ?? DEFAULT_POSTER_TEXT;
}

function getPosterDividerStroke(theme: ResolvedFrameTheme): string {
  return theme.posterTextColor
    ? "rgba(139, 52, 24, 0.35)"
    : "rgba(255, 255, 255, 0.35)";
}

const CENTERED_PHOTO_DESIGN_Y = 340;
const DIVIDER_CAP_DESIGN_Y = 520;
const LOGO_DESIGN_Y = 24;
const LOGO_TO_TITLE_GAP = 22;
const HEADER_TO_PHOTO_GAP = 28;
const MIDDLE_FOOTER_GAP = 24;
const ATTENDEE_TO_DIVIDER_GAP = 32;
const TAGLINE_AFTER_DIVIDER_GAP = 36;
const QR_AFTER_TAGLINE_GAP = 14;
const HIGHLIGHTS_FONT_SIZE = 24;
const HIGHLIGHTS_LINE_HEIGHT = 26;
const HIGHLIGHTS_MIN_FONT_SIZE = 15;
const HIGHLIGHTS_MIN_LINE_HEIGHT = 18;

function isGauravshaliTheme(theme: ResolvedFrameTheme): boolean {
  const key = theme.overlayKey ?? theme.key;
  return key === "gauravshali-sohla";
}

function resolvePhotoCenterY(
  headerBottomY: number,
  photoRadius: number,
  ringOuterInset: number,
  layout: PosterLayoutContext,
  canvasW: number,
  canvasH: number
): number {
  const headerGap = layoutScale(layout, HEADER_TO_PHOTO_GAP, canvasW);
  const minCenterY =
    headerBottomY + headerGap + photoRadius + ringOuterInset;
  const designCenterY = layoutY(
    layout,
    scaleCoordY(CENTERED_PHOTO_DESIGN_Y, canvasH),
    canvasH
  );
  return Math.max(minCenterY, designCenterY);
}

function resolvePhotoRowYOffset(
  contentBottomY: number,
  photoTopY: number,
  layout: PosterLayoutContext,
  canvasW: number
): number {
  const gap = layoutScale(layout, HEADER_TO_PHOTO_GAP, canvasW);
  return Math.max(0, contentBottomY + gap - photoTopY);
}

function middleToFooterGap(layout: PosterLayoutContext, canvasW: number): number {
  return layoutScale(layout, MIDDLE_FOOTER_GAP, canvasW);
}

/** Divider sits at least at the design cap, but never overlaps the attendee block. */
function resolveMiddleDividerY(
  layout: PosterLayoutContext,
  attendeeBottomY: number,
  canvasW: number,
  canvasH: number
): number {
  const minDividerY = layoutY(
    layout,
    scaleCoordY(DIVIDER_CAP_DESIGN_Y, canvasH),
    canvasH
  );
  const afterAttendeeY =
    attendeeBottomY +
    layoutScale(layout, ATTENDEE_TO_DIVIDER_GAP, canvasW);
  return Math.max(minDividerY, afterAttendeeY);
}

/** Gold inner ring + broken orange outer ring matching Gauravshali branding. */
function drawGauravshaliPhotoRings(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  photoRadius: number,
  theme: ResolvedFrameTheme,
  fontScale = 1
): number {
  const innerInset = Math.round(5 * fontScale);
  const innerWidth = Math.max(5, Math.round(6 * fontScale));
  const ringGap = Math.round(4 * fontScale);
  const outerWidth = Math.max(2, Math.round(3 * fontScale));
  const innerRadius = photoRadius + innerInset;
  const outerRadius = innerRadius + innerWidth / 2 + ringGap + outerWidth / 2;

  const gapHalf = 0.13;
  const gapAngles = [Math.PI / 6, (7 * Math.PI) / 6];

  ctx.save();
  ctx.shadowColor = "rgba(60, 30, 10, 0.18)";
  ctx.shadowBlur = Math.round(6 * fontScale);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(2 * fontScale);
  ctx.lineCap = "round";

  ctx.strokeStyle = theme.colors.gold;
  ctx.lineWidth = innerWidth;
  ctx.beginPath();
  ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = theme.colors.accent;
  ctx.lineWidth = outerWidth;
  for (let i = 0; i < gapAngles.length; i++) {
    const start = gapAngles[i] + gapHalf;
    let end = gapAngles[(i + 1) % gapAngles.length] - gapHalf;
    if (end <= start) end += 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(x, y, outerRadius, start, end);
    ctx.stroke();
  }

  ctx.restore();

  return outerRadius + outerWidth / 2;
}

function gauravshaliPhotoRingOuterInset(fontScale = 1): number {
  const innerInset = Math.round(5 * fontScale);
  const innerWidth = Math.max(5, Math.round(6 * fontScale));
  const ringGap = Math.round(4 * fontScale);
  const outerWidth = Math.max(2, Math.round(3 * fontScale));
  return innerInset + innerWidth + ringGap + outerWidth;
}

/** Orange + gold double rings matching the Gauravshali frame artwork. */
function drawAttendeePhotoRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  photoRadius: number,
  ringPadding: number,
  theme: ResolvedFrameTheme,
  fontScale = 1
): number {
  if (isGauravshaliTheme(theme)) {
    return drawGauravshaliPhotoRings(ctx, x, y, photoRadius, theme, fontScale);
  }

  ctx.strokeStyle = theme.colors.accent;
  ctx.lineWidth = theme.photoRingWidth;
  ctx.beginPath();
  ctx.arc(x, y, photoRadius + ringPadding, 0, Math.PI * 2);
  ctx.stroke();

  return photoRadius + ringPadding + theme.photoRingWidth / 2;
}

function getPhotoRingOuterInset(
  theme: ResolvedFrameTheme,
  ringPadding: number,
  fontScale = 1
): number {
  if (isGauravshaliTheme(theme)) {
    return gauravshaliPhotoRingOuterInset(fontScale);
  }
  return ringPadding + theme.photoRingWidth / 2;
}

function drawBmmHeader(
  ctx: CanvasRenderingContext2D,
  event: EventWithOptions,
  logo: HTMLImageElement,
  theme: ResolvedFrameTheme,
  layout: PosterLayoutContext,
  canvasW: number,
  canvasH: number,
  hashtag?: string,
  fontScale = 1
): number {
  const textColor = getPosterTextColor(theme);
  const logoSize = Math.round(52 * fontScale);
  const logoTop = layoutY(layout, scaleCoordY(LOGO_DESIGN_Y, canvasH), canvasH);
  const logoH = drawLogo(ctx, logo, canvasW / 2, logoTop, logoSize, logoSize);
  const logoBottom = logoTop + logoH;

  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = textColor;

  const nameFontSize = Math.round(40 * fontScale);
  const nameLineHeight = Math.round(36 * fontScale);
  const nameMaxWidth = layout.innerW - Math.round(32 * fontScale);
  ctx.font = posterFont(700, nameFontSize);
  const nameLines = splitTextIntoLines(ctx, event.name.toUpperCase(), nameMaxWidth);

  const titleGap = layoutScale(layout, LOGO_TO_TITLE_GAP, canvasW);
  let nameY =
    logoBottom +
    titleGap +
    Math.round(nameFontSize * 0.92);
  for (const line of nameLines) {
    fillCenteredLine(ctx, line, canvasW / 2, nameY);
    nameY += nameLineHeight;
  }

  const venueFontSize = Math.round(22 * fontScale);
  ctx.font = posterFont(600, venueFontSize);
  const venueY = nameY + Math.round(12 * fontScale);
  fillCenteredLine(ctx, getPosterVenueLine(event), canvasW / 2, venueY);

  let bottomY = venueY + Math.round(venueFontSize * 0.35);
  if (hashtag) {
    ctx.fillStyle = theme.colors.accent;
    ctx.font = posterFont(600, Math.round(18 * fontScale));
    const hashtagY = venueY + Math.round(22 * fontScale);
    fillCenteredLine(ctx, hashtag, canvasW / 2, hashtagY);
    bottomY = hashtagY + Math.round(18 * fontScale * 0.35);
  }

  return bottomY;
}

function drawGroupNameBlockCentered(
  ctx: CanvasRenderingContext2D,
  groupName: string,
  city: string,
  centerX: number,
  y: number,
  theme: ResolvedFrameTheme,
  fontScale = 1
): number {
  const textColor = getPosterTextColor(theme);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = textColor;

  const nameFontSize = Math.round(38 * fontScale);
  ctx.font = posterFont(700, nameFontSize);
  const upperName = groupName.toUpperCase();
  ctx.fillText(upperName, centerX, y);

  const nameWidth = Math.min(ctx.measureText(upperName).width, 420 * fontScale);
  ctx.strokeStyle = textColor;
  ctx.lineWidth = Math.max(2, 2 * fontScale);
  const underlineY = y + Math.round(10 * fontScale);
  ctx.beginPath();
  ctx.moveTo(centerX - nameWidth / 2, underlineY);
  ctx.lineTo(centerX + nameWidth / 2, underlineY);
  ctx.stroke();

  const cityFontSize = Math.round(26 * fontScale);
  let bottomY = underlineY;
  const cityLabel = city.trim();
  if (cityLabel) {
    ctx.font = posterFont(600, cityFontSize);
    const cityY = y + Math.round(48 * fontScale);
    ctx.fillText(cityLabel.toUpperCase(), centerX, cityY);
    bottomY = cityY + Math.round(cityFontSize * 0.35);
  }

  return bottomY;
}

function scaleCoord(value: number, canvasW: number): number {
  return (value * canvasW) / POSTER_W;
}

function scaleCoordY(value: number, canvasH: number): number {
  return (value * canvasH) / POSTER_H;
}

function drawHeadlineBlock(
  ctx: CanvasRenderingContext2D,
  lines: { text: string; color?: string }[],
  x: number,
  y: number,
  _theme: ResolvedFrameTheme
) {
  const maxWidth = POSTER_W - x - 36;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = getPosterTextColor(_theme);
  let currentY = y;
  for (const line of lines) {
    ctx.font = posterFont(700, 40);
    const wrapped = splitTextIntoLines(ctx, line.text, maxWidth);
    for (const segment of wrapped) {
      ctx.fillText(segment, x, currentY);
      currentY += 48;
    }
  }
  return currentY;
}

function drawHeadlineBlockCentered(
  ctx: CanvasRenderingContext2D,
  lines: { text: string; color?: string }[],
  centerX: number,
  startY: number,
  maxWidth: number,
  _theme: ResolvedFrameTheme
) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = getPosterTextColor(_theme);
  let currentY = startY;
  for (const line of lines) {
    ctx.font = posterFont(700, 40);
    const wrapped = splitTextIntoLines(ctx, line.text, maxWidth);
    for (const segment of wrapped) {
      ctx.fillText(segment, centerX, currentY);
      currentY += 46;
    }
  }
  return currentY;
}

function drawAttendeeBlock(
  ctx: CanvasRenderingContext2D,
  name: string,
  role: string,
  city: string,
  x: number,
  y: number,
  _theme: ResolvedFrameTheme,
  fontScale = 1
) {
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = getPosterTextColor(_theme);
  ctx.font = posterFont(700, Math.round(40 * fontScale));
  const upperName = name.toUpperCase();
  ctx.fillText(upperName, x, y);

  ctx.strokeStyle = getPosterTextColor(_theme);
  ctx.lineWidth = Math.max(2, 3 * fontScale);
  ctx.beginPath();
  ctx.moveTo(x, y + Math.round(10 * fontScale));
  ctx.lineTo(
    x + Math.min(ctx.measureText(upperName).width, 420 * fontScale),
    y + Math.round(10 * fontScale)
  );
  ctx.stroke();

  ctx.font = posterFont(600, Math.round(26 * fontScale));
  let lineY = y + Math.round(44 * fontScale);
  if (role) {
    ctx.fillText(role.toUpperCase(), x, lineY);
    lineY += Math.round(30 * fontScale);
  }
  if (city) {
    ctx.fillText(city.toUpperCase(), x, lineY);
  }
}

function drawAttendeeBlockCentered(
  ctx: CanvasRenderingContext2D,
  name: string,
  role: string,
  city: string,
  centerX: number,
  y: number,
  theme: ResolvedFrameTheme,
  fontScale = 1
): number {
  const textColor = getPosterTextColor(theme);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = textColor;

  const nameFontSize = Math.round(32 * fontScale);
  ctx.font = posterFont(700, nameFontSize);
  const upperName = name.toUpperCase();
  ctx.fillText(upperName, centerX, y);

  const nameWidth = Math.min(ctx.measureText(upperName).width, 420 * fontScale);
  ctx.strokeStyle = textColor;
  ctx.lineWidth = Math.max(2, 3 * fontScale);
  const underlineY = y + Math.round(10 * fontScale);
  ctx.beginPath();
  ctx.moveTo(centerX - nameWidth / 2, underlineY);
  ctx.lineTo(centerX + nameWidth / 2, underlineY);
  ctx.stroke();

  const roleFontSize = Math.round(20 * fontScale);
  ctx.font = posterFont(600, roleFontSize);
  let lineY = y + Math.round(34 * fontScale);
  let bottomY = underlineY;
  if (role) {
    ctx.fillText(role.toUpperCase(), centerX, lineY);
    bottomY = lineY + Math.round(roleFontSize * 0.35);
    lineY += Math.round(24 * fontScale);
  }
  if (city) {
    ctx.fillText(city.toUpperCase(), centerX, lineY);
    bottomY = lineY + Math.round(roleFontSize * 0.35);
  }
  return bottomY;
}

function drawMiddleSection(
  ctx: CanvasRenderingContext2D,
  slogan: string,
  y: number,
  layout: PosterLayoutContext,
  canvasW: number,
  theme: ResolvedFrameTheme,
  fontScale = 1
): number {
  const lineStart = layoutX(layout, scaleCoord(36, canvasW), canvasW);
  const lineEnd = layoutX(layout, canvasW - scaleCoord(36, canvasW), canvasW);

  ctx.strokeStyle = getPosterDividerStroke(theme);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(lineStart, y);
  ctx.lineTo(lineEnd, y);
  ctx.stroke();

  if (!slogan.trim()) {
    return y + Math.round(20 * fontScale);
  }

  const textY = y + Math.round(TAGLINE_AFTER_DIVIDER_GAP * fontScale);
  ctx.fillStyle = getPosterTextColor(theme);
  ctx.font = posterFont(600, Math.round(32 * fontScale));
  const textMaxWidth = layout.innerW - Math.round(48 * fontScale);
  return wrapCanvasText(
    ctx,
    slogan,
    canvasW / 2,
    textY,
    textMaxWidth,
    Math.round(40 * fontScale)
  );
}

function drawPosterQrCodeCentered(
  ctx: CanvasRenderingContext2D,
  qr: HTMLImageElement,
  topY: number,
  canvasW: number,
  fontScale = 1
): number {
  const size = Math.round(72 * fontScale);
  const pad = Math.round(7 * fontScale);
  const qrX = Math.round((canvasW - size) / 2);
  const qrY = topY;

  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
  ctx.fillRect(qrX - pad, qrY - pad, size + pad * 2, size + pad * 2);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(qrX - pad + 0.5, qrY - pad + 0.5, size + pad * 2 - 1, size + pad * 2 - 1);
  ctx.restore();

  ctx.drawImage(qr, qrX, qrY, size, size);
  return qrY + size + pad;
}

function getPosterFooterStartY(
  contentBottomY: number,
  layout: PosterLayoutContext,
  canvasW: number
): number {
  return contentBottomY + middleToFooterGap(layout, canvasW);
}

function resolveMiddleContentLayout(
  taglineBottomY: number,
  hasQr: boolean,
  fontScale = 1
): { contentBottomY: number; qrTopY: number | null } {
  if (!hasQr) {
    return { contentBottomY: taglineBottomY, qrTopY: null };
  }
  const qrTopY =
    taglineBottomY + Math.round(QR_AFTER_TAGLINE_GAP * fontScale);
  const size = Math.round(72 * fontScale);
  const pad = Math.round(7 * fontScale);
  return {
    contentBottomY: qrTopY + size + pad,
    qrTopY,
  };
}

function drawStatsBar(
  ctx: CanvasRenderingContext2D,
  stats: PosterStat[],
  y: number,
  theme: ResolvedFrameTheme
) {
  const { primary, accent, gold, green } = theme.colors;
  const barH = 118;
  const blockW = POSTER_W / stats.length;

  stats.forEach((stat, i) => {
    const x = i * blockW;
    let color = resolvePosterColor(stat.color, primary, accent, gold, green);
    if (color === primary) color = accent;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, blockW, barH);

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.direction = "ltr";
    ctx.fillStyle = "#ffffff";
    ctx.font = posterFont(700, 34);
    ctx.fillText(stat.value, x + blockW / 2, y + 52);

    ctx.font = posterFont(500, 18);
    ctx.fillText(stat.label, x + blockW / 2, y + 86);
  });
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  y: number,
  height: number,
  accent: string,
  layout: PosterLayoutContext,
  canvasW: number,
  theme: ResolvedFrameTheme,
  website?: string,
  socialHandle?: string
) {
  const lineStart = layoutX(layout, 36, canvasW);
  const lineEnd = layoutX(layout, canvasW - 36, canvasW);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lineStart, y);
  ctx.lineTo(lineEnd, y);
  ctx.stroke();

  const parts: string[] = [];
  if (website) parts.push(`🌐 ${website}`);
  if (socialHandle) parts.push(`in  ig  fb  yt  ${socialHandle}`);
  if (parts.length === 0) return;

  ctx.fillStyle = getPosterTextColor(theme);
  ctx.font = posterFont(500, 22);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "ltr";
  ctx.fillText(parts.join("   ·   "), canvasW / 2, y + height / 2);
}

function drawCountdownBanner(
  ctx: CanvasRenderingContext2D,
  message: string,
  y: number,
  theme: ResolvedFrameTheme,
  layout: PosterLayoutContext,
  canvasW: number,
  maxBarHeight?: number
): number {
  const barX = layoutX(layout, 36, canvasW);
  const barW = layout.innerW;
  const paddingX = 48;
  const maxTextWidth = barW - paddingX;
  const verticalPad = 12;

  let fontSize = 26;
  ctx.font = posterFont(700, fontSize);
  let lines = splitTextIntoLines(ctx, message, maxTextWidth);
  let lineHeight = Math.round(fontSize * 1.1);
  let barH = Math.max(50, lines.length * lineHeight + verticalPad * 2);

  while (fontSize > 16) {
    const tooWide = lines.some((line) => ctx.measureText(line).width > maxTextWidth);
    const tooTall = maxBarHeight != null && barH > maxBarHeight;
    if (!tooWide && !tooTall) break;
    fontSize -= 1;
    ctx.font = posterFont(700, fontSize);
    lines = splitTextIntoLines(ctx, message, maxTextWidth);
    lineHeight = Math.round(fontSize * 1.1);
    barH = Math.max(46, lines.length * lineHeight + verticalPad * 2);
  }

  ctx.fillStyle = theme.colors.accent;
  ctx.fillRect(barX, y, barW, barH);

  ctx.fillStyle = "#ffffff";
  ctx.font = posterFont(700, fontSize);
  const firstLineY = y + verticalPad + fontSize * 0.78;
  wrapCanvasText(ctx, message, canvasW / 2, firstLineY, maxTextWidth, lineHeight);

  return y + barH;
}

function drawEventHighlights(
  ctx: CanvasRenderingContext2D,
  highlights: string[],
  y: number,
  layout: PosterLayoutContext,
  canvasW: number,
  theme: ResolvedFrameTheme,
  maxBottomY?: number
): number {
  if (highlights.length === 0) return y;

  const maxWidth = layout.innerW - 48;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = getPosterTextColor(theme);

  let fontSize = HIGHLIGHTS_FONT_SIZE;
  let lineHeight = HIGHLIGHTS_LINE_HEIGHT;
  const topPad = 8;
  const itemGap = 4;

  const measureBottom = () => {
    ctx.font = posterFont(600, fontSize);
    let cursorY = y + topPad;
    for (const item of highlights) {
      const wrapped = splitTextIntoLines(ctx, `✓ ${item}`, maxWidth);
      cursorY += wrapped.length * lineHeight;
      cursorY += itemGap;
    }
    return cursorY;
  };

  if (maxBottomY) {
    while (
      measureBottom() > maxBottomY &&
      (fontSize > HIGHLIGHTS_MIN_FONT_SIZE || lineHeight > HIGHLIGHTS_MIN_LINE_HEIGHT)
    ) {
      if (fontSize > HIGHLIGHTS_MIN_FONT_SIZE) {
        fontSize -= 1;
      }
      if (lineHeight > HIGHLIGHTS_MIN_LINE_HEIGHT) {
        lineHeight -= 1;
      }
    }
  }

  ctx.font = posterFont(600, fontSize);
  let cursorY = y + topPad;
  for (const item of highlights) {
    const wrapped = splitTextIntoLines(ctx, `✓ ${item}`, maxWidth);
    for (const line of wrapped) {
      ctx.fillText(line, canvasW / 2, cursorY);
      cursorY += lineHeight;
    }
    cursorY += itemGap;
  }

  return cursorY;
}

function drawPosterFooterSection(
  ctx: CanvasRenderingContext2D,
  event: EventWithOptions,
  theme: ResolvedFrameTheme,
  middleEndY: number,
  layout: PosterLayoutContext,
  canvasW: number,
  canvasH: number
) {
  const config = parsePosterTemplate(event);
  const stats = config.stats ?? [];
  const countdown = getEventCountdown(event);
  const highlights = parseEventHighlights(event.eventHighlights);
  const hasFooterContent = Boolean(config.website || config.socialHandle);
  const footerBarH = hasFooterContent ? 36 : 0;
  const footerTop = canvasH - layout.inset - footerBarH - 8;
  const highlightsMaxBottom = footerTop - (hasFooterContent ? 10 : 6);
  const sectionGap = 8;

  let cursorY = middleEndY + sectionGap;

  if (countdown && highlights.length > 0) {
    const totalAvailable = Math.max(80, highlightsMaxBottom - cursorY);
    const countdownMaxH = Math.min(68, Math.floor(totalAvailable * 0.42));
    cursorY =
      drawCountdownBanner(
        ctx,
        countdown.message,
        cursorY,
        theme,
        layout,
        canvasW,
        countdownMaxH
      ) + sectionGap;
  } else if (countdown) {
    cursorY =
      drawCountdownBanner(
        ctx,
        countdown.message,
        cursorY,
        theme,
        layout,
        canvasW
      ) + sectionGap;
  }

  if (highlights.length > 0) {
    cursorY =
      drawEventHighlights(
        ctx,
        highlights,
        cursorY,
        layout,
        canvasW,
        theme,
        highlightsMaxBottom
      ) + 4;
  }

  if (stats.length > 0) {
    drawStatsBar(ctx, stats, cursorY, theme);
    cursorY += 118 + 8;
    drawFooter(
      ctx,
      cursorY,
      Math.max(footerBarH, canvasH - cursorY),
      theme.colors.accent,
      layout,
      canvasW,
      theme,
      config.website,
      config.socialHandle
    );
    return;
  }

  if (hasFooterContent) {
    drawFooter(
      ctx,
      footerTop,
      footerBarH,
      theme.colors.accent,
      layout,
      canvasW,
      theme,
      config.website,
      config.socialHandle
    );
  }
}

async function drawBmmPersonalPoster(
  ctx: CanvasRenderingContext2D,
  input: PersonalPosterRenderInput,
  logo: HTMLImageElement,
  photo: HTMLImageElement,
  theme: ResolvedFrameTheme
) {
  const { event } = input;
  const config = parsePosterTemplate(event);
  const genderTagline = getGenderTagline(event, input.genderKey);
  const hashtag = getPosterHashtag(config, event);
  const themeKey = theme.overlayKey ?? theme.key;
  const layout = getPosterLayout(themeKey, POSTER_W, POSTER_H);

  paintFrameBackground(ctx, theme, POSTER_W, POSTER_H);

  const headerBottomY = drawBmmHeader(
    ctx,
    event,
    logo,
    theme,
    layout,
    POSTER_W,
    POSTER_H,
    hashtag
  );

  const displayName = `${input.firstName} ${input.lastName}`.trim();
  const cityLabel = (input.city?.trim() || event.location || "").trim();

  const photoX = POSTER_W / 2;
  const photoRadius = layoutScale(layout, 120, POSTER_W);
  const ringPadding = layoutScale(layout, PERSONAL_PHOTO_POSITION.ringPadding, POSTER_W);
  const ringOuterInset = getPhotoRingOuterInset(theme, ringPadding);
  const photoY = resolvePhotoCenterY(
    headerBottomY,
    photoRadius,
    ringOuterInset,
    layout,
    POSTER_W,
    POSTER_H
  );

  drawCircularImage(ctx, photo, photoX, photoY, photoRadius, input.photoCrop);
  drawAttendeePhotoRing(ctx, photoX, photoY, photoRadius, ringPadding, theme);

  const nameY =
    photoY +
    photoRadius +
    getPhotoRingOuterInset(theme, ringPadding) +
    layoutScale(layout, 22, POSTER_W) +
    Math.round(32 * 0.85);
  const attendeeBottomY = drawAttendeeBlockCentered(
    ctx,
    displayName,
    input.role,
    cityLabel,
    POSTER_W / 2,
    nameY,
    theme
  );
  const middleY = resolveMiddleDividerY(
    layout,
    attendeeBottomY,
    POSTER_W,
    POSTER_H
  );

  const qrUrl = getEventQrUrl(event, "personal", config.qrUrl);
  const qr = qrUrl ? await loadQrCodeImage(qrUrl) : null;
  const middleTagline = genderTagline.trim() || event.tagline;
  const taglineBottomY = drawMiddleSection(
    ctx,
    middleTagline,
    middleY,
    layout,
    POSTER_W,
    theme
  );
  const { contentBottomY, qrTopY } = resolveMiddleContentLayout(
    taglineBottomY,
    Boolean(qr)
  );

  drawPosterFooterSection(
    ctx,
    event,
    theme,
    getPosterFooterStartY(contentBottomY, layout, POSTER_W),
    layout,
    POSTER_W,
    POSTER_H
  );

  await paintFrameOverlay(ctx, theme, POSTER_W, POSTER_H);
  if (qr && qrTopY != null) {
    drawPosterQrCodeCentered(ctx, qr, qrTopY, POSTER_W);
  }
}

export async function renderPersonalPosterCanvas(
  canvas: HTMLCanvasElement,
  input: PersonalPosterRenderInput,
  photo: HTMLImageElement
): Promise<void> {
  await ensurePosterFontsLoaded();
  const theme = resolveFrameTheme(input.event, input.frameThemeKey);
  const logo = await loadEventLogo(input.event);

  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  await drawBmmPersonalPoster(ctx, input, logo, photo, theme);
}

async function drawBmmGroupPoster(
  ctx: CanvasRenderingContext2D,
  input: GroupPosterRenderInput,
  logo: HTMLImageElement,
  photos: HTMLImageElement[],
  theme: ResolvedFrameTheme
) {
  const { event } = input;
  const { accent } = theme.colors;
  const config = parsePosterTemplate(event);
  const hashtag = getPosterHashtag(config, event);
  const groupTagline = getGenderTagline(event, "group");
  const headline = getPosterHeadline(config, event, groupTagline);
  const themeKey = theme.overlayKey ?? theme.key;
  const layout = getPosterLayout(themeKey, POSTER_W, POSTER_H);

  paintFrameBackground(ctx, theme, POSTER_W, POSTER_H);

  const headerBottomY = drawBmmHeader(
    ctx,
    event,
    logo,
    theme,
    layout,
    POSTER_W,
    POSTER_H,
    hashtag
  );

  let headerContentBottomY = headerBottomY + layoutScale(layout, 12, POSTER_W);
  if (headline.length > 0) {
    headerContentBottomY = drawHeadlineBlockCentered(
      ctx,
      headline,
      POSTER_W / 2,
      headerContentBottomY,
      layout.innerW - 80,
      theme
    );
  }

  const ringOuterInset = getPhotoRingOuterInset(theme, 5);
  const basePositions = getGroupPhotoPositions(input.memberCount).map((pos) => ({
    x: layoutX(layout, pos.x, POSTER_W),
    y: layoutY(layout, pos.y, POSTER_H),
    r: layoutScale(layout, pos.r, POSTER_W),
  }));
  const photoTopY = Math.min(
    ...basePositions.map((pos) => pos.y - pos.r - ringOuterInset)
  );
  const photoYOffset = resolvePhotoRowYOffset(
    headerContentBottomY,
    photoTopY,
    layout,
    POSTER_W
  );
  const positions = basePositions.map((pos) => ({
    ...pos,
    y: pos.y + photoYOffset,
  }));
  photos.forEach((photo, i) => {
    const pos = positions[i];
    const crop = input.photoCrops[i];
    drawCircularImage(ctx, photo, pos.x, pos.y, pos.r, crop);
    drawAttendeePhotoRing(ctx, pos.x, pos.y, pos.r, 5, theme);
  });

  const photoCenterX =
    positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
  const photoBottom =
    Math.max(
      ...positions.map((pos) => pos.y + pos.r + getPhotoRingOuterInset(theme, 5))
    ) + layoutScale(layout, 16, POSTER_W);
  const nameY = photoBottom + layoutScale(layout, 28, POSTER_W);

  const groupCity = (input.city?.trim() || event.location || "").trim();
  const groupTextBottomY = drawGroupNameBlockCentered(
    ctx,
    input.groupName.trim() || "Our Group",
    groupCity,
    photoCenterX,
    nameY,
    theme
  );
  const middleY = resolveMiddleDividerY(
    layout,
    groupTextBottomY,
    POSTER_W,
    POSTER_H
  );

  const qrUrl = getEventQrUrl(event, "group", config.qrUrl);
  const qr = qrUrl ? await loadQrCodeImage(qrUrl) : null;
  const middleTagline = groupTagline.trim() || event.tagline;
  const taglineBottomY = drawMiddleSection(
    ctx,
    middleTagline,
    middleY,
    layout,
    POSTER_W,
    theme
  );
  const { contentBottomY, qrTopY } = resolveMiddleContentLayout(
    taglineBottomY,
    Boolean(qr)
  );

  drawPosterFooterSection(
    ctx,
    event,
    theme,
    getPosterFooterStartY(contentBottomY, layout, POSTER_W),
    layout,
    POSTER_W,
    POSTER_H
  );

  await paintFrameOverlay(ctx, theme, POSTER_W, POSTER_H);
  if (qr && qrTopY != null) {
    drawPosterQrCodeCentered(ctx, qr, qrTopY, POSTER_W);
  }
}

export async function renderGroupPosterCanvas(
  canvas: HTMLCanvasElement,
  input: GroupPosterRenderInput,
  photos: HTMLImageElement[]
): Promise<void> {
  await ensurePosterFontsLoaded();
  const theme = resolveFrameTheme(input.event, input.frameThemeKey);
  const logo = await loadEventLogo(input.event);

  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  await drawBmmGroupPoster(ctx, input, logo, photos, theme);
}

async function drawPersonalDp(
  ctx: CanvasRenderingContext2D,
  input: PersonalDpRenderInput,
  logo: HTMLImageElement,
  photo: HTMLImageElement,
  theme: ResolvedFrameTheme,
  layout: PosterLayoutContext
) {
  const { event, accent } = { event: input.event, accent: theme.colors.accent };
  const config = parsePosterTemplate(event);
  const genderTagline = getGenderTagline(event, input.genderKey);
  const fontScale = DP_W / POSTER_W;

  const headerBottomY = drawBmmHeader(
    ctx,
    event,
    logo,
    theme,
    layout,
    DP_W,
    DP_H,
    undefined,
    fontScale
  );

  const displayName = `${input.firstName} ${input.lastName}`.trim();
  const cityLabel = (input.city?.trim() || event.location || "").trim();

  const photoX = DP_W / 2;
  const photoRadius = layoutScale(layout, scaleCoord(120, DP_W), DP_W);
  const ringPadding = layoutScale(
    layout,
    scaleCoord(PERSONAL_PHOTO_POSITION.ringPadding, DP_W),
    DP_W
  );
  const ringOuterInset = getPhotoRingOuterInset(theme, ringPadding, fontScale);
  const photoY = resolvePhotoCenterY(
    headerBottomY,
    photoRadius,
    ringOuterInset,
    layout,
    DP_W,
    DP_H
  );

  drawCircularImage(ctx, photo, photoX, photoY, photoRadius, input.photoCrop);
  drawAttendeePhotoRing(ctx, photoX, photoY, photoRadius, ringPadding, theme, fontScale);

  const nameY =
    photoY +
    photoRadius +
    getPhotoRingOuterInset(theme, ringPadding, fontScale) +
    layoutScale(layout, scaleCoord(22, DP_W), DP_W) +
    Math.round(32 * fontScale * 0.85);
  const attendeeBottomY = drawAttendeeBlockCentered(
    ctx,
    displayName,
    input.role,
    cityLabel,
    DP_W / 2,
    nameY,
    theme,
    fontScale
  );
  const middleY = resolveMiddleDividerY(
    layout,
    attendeeBottomY,
    DP_W,
    DP_H
  );

  const qrUrl = getEventQrUrl(event, "personal", config.qrUrl);
  const qr = qrUrl
    ? await loadQrCodeImage(qrUrl, Math.round(128 * fontScale))
    : null;
  const middleTagline = genderTagline.trim() || event.tagline;
  const taglineBottomY = drawMiddleSection(
    ctx,
    middleTagline,
    middleY,
    layout,
    DP_W,
    theme,
    fontScale
  );
  const { qrTopY } = resolveMiddleContentLayout(
    taglineBottomY,
    Boolean(qr),
    fontScale
  );

  await paintFrameOverlay(ctx, theme, DP_W, DP_H);
  if (qr && qrTopY != null) {
    drawPosterQrCodeCentered(ctx, qr, qrTopY, DP_W, fontScale);
  }
}

async function drawGroupDp(
  ctx: CanvasRenderingContext2D,
  input: GroupDpRenderInput,
  logo: HTMLImageElement,
  photos: HTMLImageElement[],
  theme: ResolvedFrameTheme,
  layout: PosterLayoutContext
) {
  const { event, accent } = { event: input.event, accent: theme.colors.accent };
  const config = parsePosterTemplate(event);
  const groupTagline = getGenderTagline(event, "group");
  const fontScale = DP_W / POSTER_W;

  const headerBottomY = drawBmmHeader(
    ctx,
    event,
    logo,
    theme,
    layout,
    DP_W,
    DP_H,
    undefined,
    fontScale
  );

  const ringOuterInset = getPhotoRingOuterInset(theme, 5, fontScale);
  const basePositions = getGroupDpPositions(input.memberCount).map((pos) => ({
    x: layoutX(layout, scaleCoord(pos.x, DP_W), DP_W),
    y: layoutY(layout, scaleCoordY(pos.y, DP_H), DP_H),
    r: layoutScale(layout, scaleCoord(pos.r, DP_W), DP_W),
  }));
  const photoTopY = Math.min(
    ...basePositions.map((pos) => pos.y - pos.r - ringOuterInset)
  );
  const photoYOffset = resolvePhotoRowYOffset(
    headerBottomY,
    photoTopY,
    layout,
    DP_W
  );
  const positions = basePositions.map((pos) => ({
    ...pos,
    y: pos.y + photoYOffset,
  }));

  photos.forEach((photo, i) => {
    const pos = positions[i];
    const crop = input.photoCrops[i];
    drawCircularImage(ctx, photo, pos.x, pos.y, pos.r, crop);
    drawAttendeePhotoRing(ctx, pos.x, pos.y, pos.r, 5, theme);
  });

  const photoCenterX =
    positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
  const photoBottom =
    Math.max(
      ...positions.map((pos) =>
        pos.y + pos.r + getPhotoRingOuterInset(theme, 5, fontScale)
      )
    ) +
    layoutScale(layout, scaleCoord(16, DP_W), DP_W);
  const nameY = photoBottom + layoutScale(layout, scaleCoordY(28, DP_H), DP_H);

  const groupCity = (input.city?.trim() || event.location || "").trim();
  const groupTextBottomY = drawGroupNameBlockCentered(
    ctx,
    input.groupName.trim() || "Our Group",
    groupCity,
    photoCenterX,
    nameY,
    theme,
    fontScale
  );
  const middleY = resolveMiddleDividerY(
    layout,
    groupTextBottomY,
    DP_W,
    DP_H
  );

  const qrUrl = getEventQrUrl(event, "group", config.qrUrl);
  const qr = qrUrl
    ? await loadQrCodeImage(qrUrl, Math.round(128 * fontScale))
    : null;
  const middleTagline = groupTagline.trim() || event.tagline;
  const taglineBottomY = drawMiddleSection(
    ctx,
    middleTagline,
    middleY,
    layout,
    DP_W,
    theme,
    fontScale
  );
  const { qrTopY } = resolveMiddleContentLayout(
    taglineBottomY,
    Boolean(qr),
    fontScale
  );

  await paintFrameOverlay(ctx, theme, DP_W, DP_H);
  if (qr && qrTopY != null) {
    drawPosterQrCodeCentered(ctx, qr, qrTopY, DP_W, fontScale);
  }
}

export async function renderPersonalDpCanvas(
  canvas: HTMLCanvasElement,
  input: PersonalDpRenderInput,
  photo: HTMLImageElement
): Promise<void> {
  await ensurePosterFontsLoaded();
  const theme = resolveFrameTheme(input.event, input.frameThemeKey);
  const logo = await loadEventLogo(input.event);

  canvas.width = DP_W;
  canvas.height = DP_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const themeKey = theme.overlayKey ?? theme.key;
  const layout = getPosterLayout(themeKey, DP_W, DP_H);

  paintFrameBackground(ctx, theme, DP_W, DP_H);
  await drawPersonalDp(ctx, input, logo, photo, theme, layout);
}

export async function renderGroupDpCanvas(
  canvas: HTMLCanvasElement,
  input: GroupDpRenderInput,
  photos: HTMLImageElement[]
): Promise<void> {
  await ensurePosterFontsLoaded();
  const theme = resolveFrameTheme(input.event, input.frameThemeKey);
  const logo = await loadEventLogo(input.event);

  canvas.width = DP_W;
  canvas.height = DP_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const themeKey = theme.overlayKey ?? theme.key;
  const layout = getPosterLayout(themeKey, DP_W, DP_H);

  paintFrameBackground(ctx, theme, DP_W, DP_H);
  await drawGroupDp(ctx, input, logo, photos, theme, layout);
}

export async function generatePersonalAssets(
  input: PersonalInput
): Promise<GeneratedAssets> {
  const photoDataUrl = await fileToDataUrl(input.photo);
  const photo = await loadImage(photoDataUrl);

  const poster = document.createElement("canvas");
  await renderPersonalPosterCanvas(poster, input, photo);

  const dp = document.createElement("canvas");
  await renderPersonalDpCanvas(dp, input, photo);

  return {
    posterDataUrl: poster.toDataURL("image/png"),
    dpDataUrl: dp.toDataURL("image/png"),
  };
}

export async function generateGroupAssets(
  input: GroupInput
): Promise<GeneratedAssets> {
  const photoDataUrls = await Promise.all(input.photos.map(fileToDataUrl));
  const photos = await Promise.all(photoDataUrls.map(loadImage));

  const poster = document.createElement("canvas");
  await renderGroupPosterCanvas(poster, input, photos);

  const dp = document.createElement("canvas");
  await renderGroupDpCanvas(dp, input, photos);

  return {
    posterDataUrl: poster.toDataURL("image/png"),
    dpDataUrl: dp.toDataURL("image/png"),
  };
}

export function getGroupPosterPhotoPositions(count: 2 | 3 | 4) {
  return getGroupPhotoPositions(count);
}

export function getGroupDpPhotoPositions(count: 2 | 3 | 4) {
  return getGroupDpPositions(count);
}

function getGroupPhotoPositions(count: number) {
  const centerY = 400;

  if (count === 2) {
    return [
      { x: 360, y: centerY, r: 100 },
      { x: 720, y: centerY, r: 100 },
    ];
  }
  if (count === 3) {
    return [
      { x: 270, y: centerY, r: 88 },
      { x: 540, y: centerY, r: 88 },
      { x: 810, y: centerY, r: 88 },
    ];
  }
  return [
    { x: 162, y: centerY, r: 72 },
    { x: 414, y: centerY, r: 72 },
    { x: 666, y: centerY, r: 72 },
    { x: 918, y: centerY, r: 72 },
  ];
}

function getGroupDpPositions(count: number) {
  const centerY = 320;

  if (count === 2) {
    return [
      { x: 220, y: centerY, r: 95 },
      { x: 420, y: centerY, r: 95 },
    ];
  }
  if (count === 3) {
    return [
      { x: 160, y: centerY, r: 78 },
      { x: 320, y: centerY, r: 78 },
      { x: 480, y: centerY, r: 78 },
    ];
  }
  return [
    { x: 95, y: centerY, r: 55 },
    { x: 235, y: centerY, r: 55 },
    { x: 375, y: centerY, r: 55 },
    { x: 515, y: centerY, r: 55 },
  ];
}
