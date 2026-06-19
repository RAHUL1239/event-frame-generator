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
  drawLogoAt,
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
  x: 250,
  y: 390,
  radius: 128,
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

function isCircularLayout(theme: ResolvedFrameTheme): boolean {
  return theme.layoutProfile === "circular";
}

type PhotoSlot = {
  x: number;
  y: number;
  radius: number;
  ringPadding: number;
};

const CIRCULAR_PHOTO_RADIUS = 96;

function layoutCircularPhoto(
  headerBottomY: number,
  layout: PosterLayoutContext,
  canvasW: number
) {
  const photoRadius = layoutScale(layout, CIRCULAR_PHOTO_RADIUS, canvasW);
  const ringPadding = layoutScale(layout, 4, canvasW);
  const gap = layoutScale(layout, 6, canvasW);
  return {
    photoX: canvasW / 2,
    photoY: headerBottomY + gap + photoRadius,
    photoRadius,
    ringPadding,
  };
}

function circularAttendeeNameBaseline(
  photoY: number,
  photoRadius: number,
  ringPadding: number,
  layout: PosterLayoutContext,
  canvasW: number,
  fontScale = 1
) {
  const photoBottom = photoY + photoRadius + ringPadding;
  const nameFontSize = Math.round(32 * fontScale);
  const gap = layoutScale(layout, 36, canvasW);
  return photoBottom + gap + Math.round(nameFontSize * 1.08);
}

function getPersonalPhotoPosition(theme: ResolvedFrameTheme): PhotoSlot {
  if (isCircularLayout(theme)) {
    return {
      x: 540,
      y: 368,
      radius: CIRCULAR_PHOTO_RADIUS,
      ringPadding: 4,
    };
  }
  return PERSONAL_PHOTO_POSITION;
}

function getGroupPhotoPositionsForTheme(
  theme: ResolvedFrameTheme,
  count: number,
  centerY?: number
) {
  if (!isCircularLayout(theme)) return getGroupPhotoPositions(count);

  const y = centerY ?? 368;
  if (count === 2) {
    return [
      { x: 460, y, r: 78 },
      { x: 620, y, r: 78 },
    ];
  }
  if (count === 3) {
    return [
      { x: 410, y, r: 70 },
      { x: 540, y, r: 70 },
      { x: 670, y, r: 70 },
    ];
  }
  return [
    { x: 380, y, r: 58 },
    { x: 490, y, r: 58 },
    { x: 600, y, r: 58 },
    { x: 710, y, r: 58 },
  ];
}

function scaleCoord(value: number, canvasW: number): number {
  return (value * canvasW) / POSTER_W;
}

function scaleCoordY(value: number, canvasH: number): number {
  return (value * canvasH) / POSTER_H;
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
  const circular = isCircularLayout(theme);
  const textColor = getPosterTextColor(theme);
  const headerScale = circular ? 0.82 * fontScale : fontScale;
  const logoSize = Math.round((circular ? 92 : 96) * headerScale);
  const nameFontSize = Math.round((circular ? 30 : 46) * headerScale);
  const nameLineHeight = Math.round((circular ? 26 : 42) * headerScale);

  let nameY: number;

  if (circular) {
    const logoTopY = layoutY(layout, scaleCoordY(28, canvasH), canvasH);
    drawLogoAt(
      ctx,
      logo,
      canvasW / 2 - logoSize / 2,
      logoTopY,
      logoSize,
      logoSize
    );
    // nameY is the text baseline — place it below the logo with a clear gap
    nameY =
      logoTopY +
      logoSize +
      Math.round(14 * headerScale) +
      Math.round(nameFontSize * 0.85);
  } else {
    drawLogoAt(
      ctx,
      logo,
      layoutX(layout, scaleCoord(36, canvasW), canvasW),
      layoutY(layout, scaleCoordY(58, canvasH), canvasH),
      logoSize,
      logoSize
    );
    nameY = layoutY(layout, scaleCoordY(40, canvasH), canvasH);
  }

  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = textColor;

  const nameMaxWidth =
    layout.innerW - (!circular && hashtag ? Math.round(72 * headerScale) : 0);
  ctx.font = posterFont(700, nameFontSize);
  const nameLines = splitTextIntoLines(ctx, event.name.toUpperCase(), nameMaxWidth);

  for (const line of nameLines) {
    fillCenteredLine(ctx, line, canvasW / 2, nameY);
    nameY += nameLineHeight;
  }

  const venueFontSize = Math.round((circular ? 20 : 26) * headerScale);
  ctx.font = posterFont(600, venueFontSize);
  const venueBaseline = nameY + Math.round((circular ? 10 : 14) * headerScale);
  fillCenteredLine(
    ctx,
    getPosterVenueLine(event),
    canvasW / 2,
    venueBaseline
  );

  if (hashtag && !circular) {
    ctx.textAlign = "right";
    ctx.font = posterFont(700, Math.round(28 * fontScale));
    ctx.fillText(
      hashtag,
      canvasW - layout.inset,
      layoutY(layout, scaleCoordY(50, canvasH), canvasH)
    );
  }

  return venueBaseline + Math.round(venueFontSize * 0.4);
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
  reserveQrSpace = false,
  fontScale = 1
) {
  const lineStart = layoutX(layout, scaleCoord(36, canvasW), canvasW);
  const lineEnd = layoutX(layout, canvasW - scaleCoord(36, canvasW), canvasW);

  ctx.strokeStyle = getPosterDividerStroke(theme);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(lineStart, y);
  ctx.lineTo(lineEnd, y);
  ctx.stroke();

  const textY = y + Math.round(58 * fontScale);
  ctx.fillStyle = getPosterTextColor(theme);
  ctx.font = posterFont(
    600,
    Math.round((isCircularLayout(theme) ? 30 : 36) * fontScale)
  );
  const textMaxWidth = reserveQrSpace
    ? canvasW - layout.inset * 2 - Math.round(220 * fontScale)
    : layout.innerW - Math.round(80 * fontScale);
  wrapCanvasText(
    ctx,
    slogan,
    canvasW / 2,
    textY,
    textMaxWidth,
    Math.round(44 * fontScale)
  );
}

function drawPosterQrCode(
  ctx: CanvasRenderingContext2D,
  qr: HTMLImageElement,
  middleY: number,
  layout: PosterLayoutContext,
  canvasW: number,
  fontScale = 1
) {
  const lineEnd = layoutX(layout, canvasW - scaleCoord(36, canvasW), canvasW);
  const size = Math.round(96 * fontScale);
  const qrX = lineEnd - size - layoutScale(layout, Math.round(12 * fontScale), canvasW);
  const qrY = middleY + Math.round(16 * fontScale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(qrX - 6, qrY - 6, size + 12, size + 12);
  ctx.drawImage(qr, qrX, qrY, size, size);
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

  ctx.fillStyle = getPosterTextColor(theme);
  ctx.font = posterFont(500, 24);
  ctx.textBaseline = "middle";
  ctx.direction = "ltr";
  if (website) {
    ctx.textAlign = "left";
    ctx.fillText(`🌐 ${website}`, lineStart + 4, y + height / 2);
  }

  if (socialHandle) {
    ctx.textAlign = "right";
    ctx.fillText(`in  ig  fb  yt  ${socialHandle}`, lineEnd - 4, y + height / 2);
  }
}

function drawCountdownBanner(
  ctx: CanvasRenderingContext2D,
  message: string,
  y: number,
  theme: ResolvedFrameTheme,
  layout: PosterLayoutContext,
  canvasW: number
): number {
  const barX = layoutX(layout, 36, canvasW);
  const barW = layout.innerW;
  const circular = isCircularLayout(theme);
  const paddingX = circular ? 36 : 56;
  const maxTextWidth = barW - paddingX;
  const verticalPad = circular ? 16 : 22;

  let fontSize = circular ? 28 : 38;
  ctx.font = posterFont(700, fontSize);
  let lines = splitTextIntoLines(ctx, message, maxTextWidth);

  while (fontSize > (circular ? 18 : 22)) {
    const tooWide = lines.some((line) => ctx.measureText(line).width > maxTextWidth);
    if (!tooWide) break;
    fontSize -= 1;
    ctx.font = posterFont(700, fontSize);
    lines = splitTextIntoLines(ctx, message, maxTextWidth);
  }

  const lineHeight = Math.round(fontSize * 1.15);
  const barH = Math.max(76, lines.length * lineHeight + verticalPad * 2);

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
  theme: ResolvedFrameTheme
): number {
  if (highlights.length === 0) return y;

  const maxWidth = layout.innerW - 48;
  const circular = isCircularLayout(theme);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = getPosterTextColor(theme);
  ctx.font = posterFont(600, circular ? 22 : 26);

  let cursorY = y + (circular ? 14 : 20);
  for (const item of highlights) {
    const wrapped = splitTextIntoLines(ctx, `✓ ${item}`, maxWidth);
    for (const line of wrapped) {
      ctx.fillText(line, canvasW / 2, cursorY);
      cursorY += circular ? 26 : 30;
    }
    cursorY += 4;
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

  let cursorY = middleEndY + 8;
  if (countdown) {
    cursorY =
      drawCountdownBanner(ctx, countdown.message, cursorY, theme, layout, canvasW) + 8;
  }

  if (highlights.length > 0) {
    cursorY = drawEventHighlights(ctx, highlights, cursorY, layout, canvasW, theme) + 6;
  }

  if (stats.length > 0) {
    drawStatsBar(ctx, stats, cursorY, theme);
    cursorY += 118 + 8;
  } else {
    cursorY += 8;
  }

  const footerH = Math.max(52, canvasH - cursorY);
  drawFooter(
    ctx,
    cursorY,
    footerH,
    theme.colors.accent,
    layout,
    canvasW,
    theme,
    config.website,
    config.socialHandle
  );
}

async function drawBmmPersonalPoster(
  ctx: CanvasRenderingContext2D,
  input: PersonalPosterRenderInput,
  logo: HTMLImageElement,
  photo: HTMLImageElement,
  theme: ResolvedFrameTheme
) {
  const { event } = input;
  const { accent } = theme.colors;
  const config = parsePosterTemplate(event);
  const genderTagline = getGenderTagline(event, input.genderKey);
  const hashtag = getPosterHashtag(config, event);
  const headline = getPosterHeadline(config, event, genderTagline);
  const themeKey = theme.overlayKey ?? theme.key;
  const layout = getPosterLayout(themeKey, POSTER_W, POSTER_H);

  paintFrameBackground(ctx, theme, POSTER_W, POSTER_H);

  const circular = isCircularLayout(theme);

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

  let photoX: number;
  let photoY: number;
  let photoRadius: number;
  let ringPadding: number;

  if (circular) {
    ({ photoX, photoY, photoRadius, ringPadding } = layoutCircularPhoto(
      headerBottomY,
      layout,
      POSTER_W
    ));
  } else {
    const photoPos = getPersonalPhotoPosition(theme);
    photoX = layoutX(layout, photoPos.x, POSTER_W);
    photoY = layoutY(layout, photoPos.y, POSTER_H);
    photoRadius = layoutScale(layout, photoPos.radius, POSTER_W);
    ringPadding = layoutScale(layout, photoPos.ringPadding, POSTER_W);
  }
  drawCircularImage(ctx, photo, photoX, photoY, photoRadius, input.photoCrop);
  ctx.strokeStyle = accent;
  ctx.lineWidth = theme.photoRingWidth;
  ctx.beginPath();
  ctx.arc(photoX, photoY, photoRadius + ringPadding, 0, Math.PI * 2);
  ctx.stroke();

  const displayName = `${input.firstName} ${input.lastName}`.trim();
  const cityLabel = (input.city?.trim() || event.location || "").trim();

  if (circular) {
    const nameY = circularAttendeeNameBaseline(
      photoY,
      photoRadius,
      ringPadding,
      layout,
      POSTER_W
    );
    const attendeeBottomY = drawAttendeeBlockCentered(
      ctx,
      displayName,
      input.role,
      cityLabel,
      POSTER_W / 2,
      nameY,
      theme
    );

    const middleY =
      attendeeBottomY + layoutScale(layout, 40, POSTER_W);
    const qrUrl = getEventQrUrl(event, "personal", config.qrUrl);
    const qr = qrUrl ? await loadQrCodeImage(qrUrl) : null;
    const middleTagline = genderTagline.trim() || event.tagline;
    drawMiddleSection(
      ctx,
      middleTagline,
      middleY,
      layout,
      POSTER_W,
      theme,
      Boolean(qr)
    );

    drawPosterFooterSection(
      ctx,
      event,
      theme,
      middleY + 118,
      layout,
      POSTER_W,
      POSTER_H
    );

    await paintFrameOverlay(ctx, theme, POSTER_W, POSTER_H);
    if (qr) {
      drawPosterQrCode(ctx, qr, middleY, layout, POSTER_W);
    }
    return;
  }

  const textGap = layoutScale(layout, 20, POSTER_W);
  const infoX = photoX + photoRadius + ringPadding + textGap;
  let infoY = photoY - layoutScale(layout, 22, POSTER_H);
  if (headline.length > 0) {
    const headlineEndY = drawHeadlineBlock(
      ctx,
      headline,
      infoX,
      layoutY(layout, 200, POSTER_H),
      theme
    );
    infoY = Math.max(infoY, headlineEndY + layoutScale(layout, 12, POSTER_H));
  }

  drawAttendeeBlock(ctx, displayName, input.role, cityLabel, infoX, infoY, theme);

  const middleY = layoutY(layout, 560, POSTER_H);
  const qrUrl = getEventQrUrl(event, "personal", config.qrUrl);
  const qr = qrUrl ? await loadQrCodeImage(qrUrl) : null;
  const middleTagline = genderTagline.trim() || event.tagline;
  drawMiddleSection(
    ctx,
    middleTagline,
    middleY,
    layout,
    POSTER_W,
    theme,
    Boolean(qr)
  );

  drawPosterFooterSection(
    ctx,
    event,
    theme,
    middleY + 118,
    layout,
    POSTER_W,
    POSTER_H
  );

  await paintFrameOverlay(ctx, theme, POSTER_W, POSTER_H);
  if (qr) {
    drawPosterQrCode(ctx, qr, middleY, layout, POSTER_W);
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

  const circular = isCircularLayout(theme);

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

  if (headline.length > 0 && !circular) {
    drawHeadlineBlockCentered(
      ctx,
      headline,
      POSTER_W / 2,
      layoutY(layout, 150, POSTER_H),
      layout.innerW - 80,
      theme
    );
  }

  const groupPhotoRowY = circular
    ? headerBottomY +
      layoutScale(layout, 14, POSTER_W) +
      layoutScale(
        layout,
        input.memberCount === 2 ? 78 : input.memberCount === 3 ? 70 : 58,
        POSTER_W
      )
    : undefined;

  const positions = getGroupPhotoPositionsForTheme(theme, input.memberCount).map(
    (pos) => ({
      x: layoutX(layout, pos.x, POSTER_W),
      y: groupPhotoRowY ?? layoutY(layout, pos.y, POSTER_H),
      r: layoutScale(layout, pos.r, POSTER_W),
    })
  );
  photos.forEach((photo, i) => {
    const pos = positions[i];
    const crop = input.photoCrops[i];
    drawCircularImage(ctx, photo, pos.x, pos.y, pos.r, crop);
    ctx.strokeStyle = accent;
    ctx.lineWidth = theme.photoRingWidth;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, pos.r + 5, 0, Math.PI * 2);
    ctx.stroke();
  });

  const photoCenterX =
    positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
  const photoBottom =
    Math.max(...positions.map((pos) => pos.y + pos.r + 5)) +
    layoutScale(layout, 16, POSTER_W);
  const nameY = photoBottom + layoutScale(layout, 28, POSTER_H);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = getPosterTextColor(theme);
  ctx.font = posterFont(700, circular ? 32 : 38);
  const groupName = input.groupName.trim() || "Our Group";
  ctx.fillText(groupName.toUpperCase(), photoCenterX, nameY);

  const groupCity = (input.city?.trim() || event.location || "").trim();
  let middleY = nameY + layoutScale(layout, 36, POSTER_H);
  if (groupCity) {
    ctx.font = posterFont(600, 26);
    ctx.fillText(
      groupCity.toUpperCase(),
      photoCenterX,
      nameY + layoutScale(layout, 34, POSTER_H)
    );
    middleY = nameY + layoutScale(layout, 68, POSTER_H);
  }

  const qrUrl = getEventQrUrl(event, "group", config.qrUrl);
  const qr = qrUrl ? await loadQrCodeImage(qrUrl) : null;
  const middleTagline = groupTagline.trim() || event.tagline;
  drawMiddleSection(
    ctx,
    middleTagline,
    middleY,
    layout,
    POSTER_W,
    theme,
    Boolean(qr)
  );

  drawPosterFooterSection(
    ctx,
    event,
    theme,
    middleY + 118,
    layout,
    POSTER_W,
    POSTER_H
  );

  await paintFrameOverlay(ctx, theme, POSTER_W, POSTER_H);
  if (qr) {
    drawPosterQrCode(ctx, qr, middleY, layout, POSTER_W);
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
  const circular = isCircularLayout(theme);
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

  let photoX: number;
  let photoY: number;
  let photoRadius: number;
  let ringPadding: number;

  if (circular) {
    ({ photoX, photoY, photoRadius, ringPadding } = layoutCircularPhoto(
      headerBottomY,
      layout,
      DP_W
    ));
  } else {
    const photoPos = getPersonalPhotoPosition(theme);
    photoX = layoutX(layout, scaleCoord(photoPos.x, DP_W), DP_W);
    photoY = layoutY(layout, scaleCoordY(photoPos.y, DP_H), DP_H);
    photoRadius = layoutScale(
      layout,
      scaleCoord(photoPos.radius, DP_W),
      DP_W
    );
    ringPadding = layoutScale(
      layout,
      scaleCoord(photoPos.ringPadding, DP_W),
      DP_W
    );
  }

  drawCircularImage(ctx, photo, photoX, photoY, photoRadius, input.photoCrop);
  ctx.strokeStyle = accent;
  ctx.lineWidth = theme.photoRingWidth;
  ctx.beginPath();
  ctx.arc(photoX, photoY, photoRadius + ringPadding, 0, Math.PI * 2);
  ctx.stroke();

  const displayName = `${input.firstName} ${input.lastName}`.trim();
  const cityLabel = (input.city?.trim() || event.location || "").trim();

  if (circular) {
    const nameY = circularAttendeeNameBaseline(
      photoY,
      photoRadius,
      ringPadding,
      layout,
      DP_W,
      fontScale
    );
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

    const middleY =
      attendeeBottomY + layoutScale(layout, scaleCoord(40, DP_W), DP_W);
    const qrUrl = getEventQrUrl(event, "personal", config.qrUrl);
    const qr = qrUrl
      ? await loadQrCodeImage(qrUrl, Math.round(128 * fontScale))
      : null;
    const middleTagline = genderTagline.trim() || event.tagline;
    drawMiddleSection(
      ctx,
      middleTagline,
      middleY,
      layout,
      DP_W,
      theme,
      Boolean(qr),
      fontScale
    );

    await paintFrameOverlay(ctx, theme, DP_W, DP_H);
    if (qr) {
      drawPosterQrCode(ctx, qr, middleY, layout, DP_W, fontScale);
    }
    return;
  }

  const textGap = layoutScale(layout, scaleCoord(20, DP_W), DP_W);
  const infoX = photoX + photoRadius + ringPadding + textGap;
  const infoY = photoY - layoutScale(layout, scaleCoordY(22, DP_H), DP_H);
  drawAttendeeBlock(
      ctx,
      displayName,
      input.role,
      cityLabel,
      infoX,
      infoY,
      theme,
      fontScale
    );

  const middleY = layoutY(
    layout,
    scaleCoordY(560, DP_H),
    DP_H
  );
  const qrUrl = getEventQrUrl(event, "personal", config.qrUrl);
  const qr = qrUrl
    ? await loadQrCodeImage(qrUrl, Math.round(128 * fontScale))
    : null;
  const middleTagline = genderTagline.trim() || event.tagline;
  drawMiddleSection(
    ctx,
    middleTagline,
    middleY,
    layout,
    DP_W,
    theme,
    Boolean(qr),
    fontScale
  );

  await paintFrameOverlay(ctx, theme, DP_W, DP_H);
  if (qr) {
    drawPosterQrCode(ctx, qr, middleY, layout, DP_W, fontScale);
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
  const circular = isCircularLayout(theme);
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

  const groupPhotoRowY = circular
    ? headerBottomY +
      layoutScale(layout, scaleCoord(14, DP_W), DP_W) +
      layoutScale(
        layout,
        scaleCoord(
          input.memberCount === 2 ? 78 : input.memberCount === 3 ? 70 : 58,
          DP_W
        ),
        DP_W
      )
    : undefined;

  const positions = getGroupPhotoPositionsForTheme(theme, input.memberCount).map(
    (pos) => ({
      x: layoutX(layout, scaleCoord(pos.x, DP_W), DP_W),
      y:
        groupPhotoRowY ??
        layoutY(layout, scaleCoordY(pos.y, DP_H), DP_H),
      r: layoutScale(layout, scaleCoord(pos.r, DP_W), DP_W),
    })
  );

  photos.forEach((photo, i) => {
    const pos = positions[i];
    const crop = input.photoCrops[i];
    drawCircularImage(ctx, photo, pos.x, pos.y, pos.r, crop);
    ctx.strokeStyle = accent;
    ctx.lineWidth = theme.photoRingWidth;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, pos.r + 5, 0, Math.PI * 2);
    ctx.stroke();
  });

  const photoCenterX =
    positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
  const photoBottom =
    Math.max(...positions.map((pos) => pos.y + pos.r + 5)) +
    layoutScale(layout, scaleCoord(16, DP_W), DP_W);
  const nameY = photoBottom + layoutScale(layout, scaleCoordY(28, DP_H), DP_H);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = getPosterTextColor(theme);
  ctx.font = posterFont(700, Math.round((circular ? 32 : 38) * fontScale));
  const groupName = input.groupName.trim() || "Our Group";
  ctx.fillText(groupName.toUpperCase(), photoCenterX, nameY);

  const groupCity = (input.city?.trim() || event.location || "").trim();
  let middleY = nameY + layoutScale(layout, scaleCoordY(36, DP_H), DP_H);
  if (groupCity) {
    ctx.font = posterFont(600, Math.round(26 * fontScale));
    ctx.fillText(
      groupCity.toUpperCase(),
      photoCenterX,
      nameY + layoutScale(layout, scaleCoordY(34, DP_H), DP_H)
    );
    middleY = nameY + layoutScale(layout, scaleCoordY(68, DP_H), DP_H);
  }

  const qrUrl = getEventQrUrl(event, "group", config.qrUrl);
  const qr = qrUrl
    ? await loadQrCodeImage(qrUrl, Math.round(128 * fontScale))
    : null;
  const middleTagline = groupTagline.trim() || event.tagline;
  drawMiddleSection(
    ctx,
    middleTagline,
    middleY,
    layout,
    DP_W,
    theme,
    Boolean(qr),
    fontScale
  );

  await paintFrameOverlay(ctx, theme, DP_W, DP_H);
  if (qr) {
    drawPosterQrCode(ctx, qr, middleY, layout, DP_W, fontScale);
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
