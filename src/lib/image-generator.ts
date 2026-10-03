import type { EventWithOptions, GeneratedAssets, GroupFormData, PersonalFormData } from "./types";
import {
  drawFrameThemeDecoration,
  resolveFrameTheme,
  type ResolvedFrameTheme,
} from "./frame-themes";
import {
  getFrameOverlayInset,
  getOverlayPhotoHole,
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
import { parseMiddleTaglines } from "./middle-taglines";
import {
  getPosterHashtag,
  getPosterHeadline,
  getPosterTicketUrl,
  getPosterVenueLine,
  formatPosterTicketLabel,
  parsePosterTemplate,
  resolvePosterColor,
  resolvePosterTextColor,
  type PosterHeadlineLine,
  type PosterStat,
} from "./poster-template";
import {
  drawCircularImage,
  drawLogo,
  fileToDataUrl,
  loadEventLogo,
  loadImage,
} from "./utils";
import {
  fillCenteredLine,
  fillTextWithSpaces,
  measureLineWidth,
  splitTextIntoLines,
  wrapCanvasText,
} from "./canvas-text";
import { ensurePosterFontsLoaded, posterFont } from "./poster-fonts";
import {
  drawGsCompactHeader,
  drawGsHeadlineTagline,
  drawGsPhotoRings,
  drawGsPosterFooter,
  paintGsBackground,
  paintGsGroupPhotosWarmAccent,
  paintGsPhotoWarmAccent,
  usesGsContentLayout,
} from "./gs-poster-layout";
import {
  drawOneWorldGroupDp,
  drawOneWorldGroupPoster,
  drawOneWorldPersonalDp,
  drawOneWorldPersonalPoster,
  isOneWorldLayout,
} from "./one-world-poster-layout";
import {
  drawOverlayHoleName,
  drawOverlayHolePhoto,
  isOverlayHoleLayout,
} from "./overlay-hole-layout";

type PersonalInput = PersonalFormData & {
  event: EventWithOptions;
  attendeeCount?: number;
};
type GroupInput = GroupFormData & {
  event: EventWithOptions;
  attendeeCount?: number;
};

const POSTER_W = 1080;
const POSTER_H = 1080;

export type PersonalPosterRenderInput = Omit<PersonalFormData, "photo"> & {
  event: EventWithOptions;
  attendeeCount?: number;
};

export type GroupPosterRenderInput = Omit<GroupFormData, "photos" | "members"> & {
  event: EventWithOptions;
  attendeeCount?: number;
};

export const PERSONAL_POSTER_W = POSTER_W;
export const PERSONAL_POSTER_H = POSTER_H;
export const PERSONAL_PHOTO_POSITION = {
  x: 250,
  y: 390,
  radius: 248,
  ringPadding: 6,
};

export function getPersonalPhotoHitTarget(themeKey?: string | null) {
  const hole = getOverlayPhotoHole(themeKey, POSTER_W, POSTER_H);
  if (hole) {
    return { ...hole, ringPadding: 0 };
  }
  return PERSONAL_PHOTO_POSITION;
}

export function getGroupPosterPhotoHitTargets(
  count: 2 | 3 | 4,
  themeKey?: string | null
) {
  const hole = getOverlayPhotoHole(themeKey, POSTER_W, POSTER_H);
  if (hole) {
    return [{ x: hole.x, y: hole.y, r: hole.radius }];
  }
  return getGroupPhotoPositions(count);
}

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

function getEventGenderTagline(event: EventWithOptions, key: string) {
  return event.genderOptions.find((o) => o.key === key)?.tagline ?? "";
}

function frameFont(
  theme: ResolvedFrameTheme,
  weight: 400 | 500 | 600 | 700 | "bold" | "normal",
  sizePx: number
) {
  return posterFont(weight, sizePx, theme.paint.type.fontFamily);
}

function paintFrameBackground(
  ctx: CanvasRenderingContext2D,
  theme: ResolvedFrameTheme,
  width: number,
  height: number
) {
  if (theme.paint.background === "gs-cream") {
    paintGsBackground(ctx, width, height, theme.paint.creamBackground);
    return;
  }
  if (theme.paint.background === "one-world") {
    return;
  }
  if (theme.paint.layout === "overlay-hole") {
    ctx.fillStyle = theme.colors.background;
    ctx.fillRect(0, 0, width, height);
    return;
  }
  ctx.fillStyle = theme.colors.primary;
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

function getPosterTextColor(theme: ResolvedFrameTheme): string {
  return theme.paint.posterTextColor;
}

function getPosterDividerStroke(theme: ResolvedFrameTheme): string {
  return theme.paint.dividerStroke;
}

const LEFT_PHOTO_DESIGN_X = 250;
const LEFT_PHOTO_DESIGN_Y = 390;
const DIVIDER_CAP_DESIGN_Y = 520;
const LOGO_DESIGN_Y = 24;
const LOGO_TO_TITLE_GAP = 22;
const HEADER_TO_PHOTO_GAP = 28;
const MIDDLE_FOOTER_GAP = 24;
const ATTENDEE_TO_DIVIDER_GAP = 32;
const TAGLINE_AFTER_DIVIDER_GAP = 36;
const HIGHLIGHTS_FONT_SIZE = 24;
const HIGHLIGHTS_LINE_HEIGHT = 26;
const HIGHLIGHTS_MIN_FONT_SIZE = 15;
const HIGHLIGHTS_MIN_LINE_HEIGHT = 16;
const HIGHLIGHT_BLOCK_MIN_H = 52;
const HIGHLIGHT_BLOCK_GAP = 8;
const TICKET_FOOTER_H = 48;
const RSVP_SHARE_ATTRIBUTION = "https://www.RSVPshare.com";
const RSVP_SHARE_ATTRIBUTION_COLOR = "#2563EB";

function drawRsvpShareAttribution(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  fontScale = 1,
  bottomInset = 8,
  color = RSVP_SHARE_ATTRIBUTION_COLOR,
  raiseOffset = 0,
  text = RSVP_SHARE_ATTRIBUTION,
  fontFamily?: string,
  attributionSize = 20
) {
  const fontSize = Math.round(attributionSize * fontScale);
  ctx.save();
  ctx.font = posterFont(700, fontSize, fontFamily);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.direction = "ltr";
  ctx.fillText(
    text,
    canvasW / 2,
    canvasH - Math.round(bottomInset * fontScale) - raiseOffset
  );
  ctx.restore();
}

function drawPosterAttribution(
  ctx: CanvasRenderingContext2D,
  theme: ResolvedFrameTheme,
  canvasW: number,
  canvasH: number,
  fontScale = 1
) {
  if (isOneWorldLayout(theme) || !theme.paint.attribution.text) {
    return;
  }
  const attribution = theme.paint.attribution;
  const fontFamily = theme.paint.type.fontFamily;
  if (attribution.useOverlayInset) {
    const themeKey = theme.overlayKey ?? theme.key;
    const borderInset = getFrameOverlayInset(themeKey, canvasW);
    const bottomInset = Math.max(10, Math.round(borderInset * 0.22));
    drawRsvpShareAttribution(
      ctx,
      canvasW,
      canvasH,
      fontScale,
      bottomInset,
      RSVP_SHARE_ATTRIBUTION_COLOR,
      attribution.raise,
      attribution.text,
      fontFamily,
      theme.paint.type.attributionSize
    );
    return;
  }

  drawRsvpShareAttribution(
    ctx,
    canvasW,
    canvasH,
    fontScale,
    attribution.bottomInset,
    RSVP_SHARE_ATTRIBUTION_COLOR,
    attribution.raise,
    attribution.text,
    fontFamily,
    theme.paint.type.attributionSize
  );
}

function photoRingDimensions(fontScale = 1) {
  return {
    innerInset: Math.round(6 * fontScale),
    innerWidth: Math.max(8, Math.round(10 * fontScale)),
    outerWidth: Math.max(6, Math.round(8 * fontScale)),
    ringGap: Math.round(5 * fontScale),
  };
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
    scaleCoordY(LEFT_PHOTO_DESIGN_Y, canvasH),
    canvasH
  );
  return Math.max(minCenterY, designCenterY);
}

function resolveLeftPhotoX(
  layout: PosterLayoutContext,
  canvasW: number
): number {
  return layoutX(layout, scaleCoord(LEFT_PHOTO_DESIGN_X, canvasW), canvasW);
}

function resolveTextColumnX(
  photoX: number,
  photoRadius: number,
  ringOuterInset: number,
  layout: PosterLayoutContext,
  canvasW: number
): number {
  return (
    photoX +
    photoRadius +
    ringOuterInset +
    layoutScale(layout, 28, canvasW)
  );
}

/** GS personal: text column on the right half of the poster. */
const GS_TEXT_DESIGN_X = 560;

function resolveGsTextColumnLayout(
  layout: PosterLayoutContext,
  canvasW: number,
  photoX: number,
  photoRadius: number,
  ringOuterInset: number
): { textX: number; textMaxWidth: number } {
  const photoRight = photoX + photoRadius + ringOuterInset;
  const minTextX = photoRight + layoutScale(layout, 44, canvasW);
  const designTextX = layoutX(
    layout,
    scaleCoord(GS_TEXT_DESIGN_X, canvasW),
    canvasW
  );
  const textX = Math.max(minTextX, designTextX);
  const textMaxWidth = Math.max(
    220,
    canvasW - textX - layout.inset - layoutScale(layout, 24, canvasW)
  );
  return { textX, textMaxWidth };
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

/** Top of the text column beside the photo (headline starts here). */
function resolvePersonalTextColumnTopY(
  photoY: number,
  photoRadius: number,
  ringOuterInset: number,
  fontScale = 1
): number {
  const photoTop = photoY - photoRadius - ringOuterInset;
  return photoTop + Math.round(10 * fontScale);
}

/** Divider beside the photo row — used for group posters centered under photos. */
function resolveMiddleBesidePhotoY(
  photoY: number,
  photoRadius: number,
  textColumnBottomY: number,
  layout: PosterLayoutContext,
  canvasW: number,
  canvasH: number
): number {
  const capY = layoutY(
    layout,
    scaleCoordY(DIVIDER_CAP_DESIGN_Y, canvasH),
    canvasH
  );
  const besidePhotoY =
    photoY + Math.round(photoRadius * 0.55) + layoutScale(layout, 4, canvasW);
  const afterTextY =
    textColumnBottomY + layoutScale(layout, ATTENDEE_TO_DIVIDER_GAP, canvasW);
  return Math.max(capY, besidePhotoY, afterTextY);
}

/** Thick gold (yellow) inner + red outer rings on all themes. */
function drawAttendeePhotoRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  photoRadius: number,
  _ringPadding: number,
  theme: ResolvedFrameTheme,
  fontScale = 1
): number {
  if (theme.paint.photoRing === "none") {
    return photoRadius;
  }

  if (theme.paint.photoRing === "gs") {
    drawGsPhotoRings(ctx, x, y, photoRadius, fontScale, {
      inner: theme.colors.gold,
      outer: theme.colors.accent,
    });
    return photoRadius + getPhotoRingOuterInset(_ringPadding, fontScale, theme);
  }

  if (theme.paint.photoRing === "rainbow") {
    return photoRadius + getPhotoRingOuterInset(_ringPadding, fontScale, theme);
  }

  const { innerInset, innerWidth, outerWidth, ringGap } =
    photoRingDimensions(fontScale);
  const innerRadius = photoRadius + innerInset;
  const outerRadius = innerRadius + innerWidth / 2 + ringGap + outerWidth / 2;

  ctx.save();
  ctx.lineCap = "round";

  ctx.strokeStyle = theme.colors.gold;
  ctx.lineWidth = innerWidth;
  ctx.beginPath();
  ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = theme.colors.accent;
  ctx.lineWidth = outerWidth;
  ctx.beginPath();
  ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();

  return outerRadius + outerWidth / 2;
}

function getPhotoRingOuterInset(
  _ringPadding: number,
  fontScale = 1,
  theme?: ResolvedFrameTheme
): number {
  if (theme?.paint.photoRing === "none") {
    return 0;
  }
  const { innerInset, innerWidth, outerWidth, ringGap } =
    photoRingDimensions(fontScale);
  return innerInset + innerWidth + ringGap + outerWidth;
}

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }
  ctx.fill();
}

function drawRoleBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  background: string,
  color: string,
  x: number,
  centerY: number,
  theme: ResolvedFrameTheme,
  fontScale: number,
  maxRight: number
) {
  const fontSize = Math.round(16 * fontScale);
  ctx.save();
  ctx.font = frameFont(theme, 700, fontSize);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const padX = Math.round(14 * fontScale);
  const padY = Math.round(7 * fontScale);
  const textW = ctx.measureText(text).width;
  const h = fontSize + padY * 2;
  const w = Math.min(textW + padX * 2, Math.max(40, maxRight - x));
  const y = centerY - h / 2;
  ctx.fillStyle = background;
  fillRoundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = color;
  ctx.fillText(text, x + padX, centerY, w - padX * 2);
  ctx.restore();
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
  const type = theme.paint.type;
  const logoSize = Math.round((theme.paint.logoSize ?? 96) * fontScale);
  const logoTop = layoutY(layout, scaleCoordY(LOGO_DESIGN_Y, canvasH), canvasH);
  let logoScale = logoSize / Math.max(1, logo.width);
  if (logo.height * logoScale > logoSize) {
    logoScale = logoSize / Math.max(1, logo.height);
  }
  const logoW = logo.width * logoScale;
  const logoH = drawLogo(ctx, logo, canvasW / 2, logoTop, logoSize, logoSize);
  const logoBottom = logoTop + logoH;

  const badge = theme.paint.roleBadge;
  if (badge) {
    const gap = Math.round(14 * fontScale);
    const maxRight = layout.inset + layout.innerW - Math.round(8 * fontScale);
    let badgeX = canvasW / 2 + logoW / 2 + gap;
    const estimatedW = Math.round(220 * fontScale);
    if (badgeX + estimatedW > maxRight) {
      badgeX = Math.max(
        layout.inset + Math.round(8 * fontScale),
        canvasW / 2 - logoW / 2 - gap - estimatedW
      );
    }
    drawRoleBadge(
      ctx,
      badge.text,
      badge.background,
      badge.color,
      badgeX,
      logoTop + logoH / 2,
      theme,
      fontScale,
      maxRight
    );
  }

  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = textColor;

  const nameFontSize = Math.round(type.headerNameSize * fontScale);
  const nameLineHeight = Math.round(type.headerNameLine * fontScale);
  const nameMaxWidth = layout.innerW - Math.round(32 * fontScale);
  ctx.font = frameFont(theme, 700, nameFontSize);
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

  const venueFontSize = Math.round(type.headerVenueSize * fontScale);
  ctx.font = frameFont(theme, 600, venueFontSize);
  const venueY = nameY + Math.round(12 * fontScale);
  fillCenteredLine(ctx, getPosterVenueLine(event), canvasW / 2, venueY);

  let bottomY = venueY + Math.round(venueFontSize * 0.35);
  if (hashtag) {
    ctx.fillStyle = theme.colors.accent;
    ctx.font = frameFont(theme, 600, Math.round(type.headerHashtagSize * fontScale));
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
  ctx.font = frameFont(theme, 700, nameFontSize);
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
    ctx.font = frameFont(theme, 600, cityFontSize);
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
  lines: PosterHeadlineLine[],
  x: number,
  y: number,
  theme: ResolvedFrameTheme,
  maxWidth: number,
  fontScale = 1,
  extraLineGaps: number[] = []
): number {
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  let currentY = y;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    ctx.fillStyle = resolveHeadlineLineColor(line.color, theme);
    ctx.font = frameFont(
      theme,
      700,
      Math.round(theme.paint.type.headlineSize * fontScale)
    );
    const wrapped = splitTextIntoLines(ctx, line.text, maxWidth);
    for (const segment of wrapped) {
      ctx.fillText(segment, x, currentY);
      currentY += Math.round(theme.paint.type.headlineLine * fontScale);
    }
    const extraGap = extraLineGaps[i] ?? 0;
    if (extraGap > 0) {
      currentY += extraGap;
    }
  }
  return currentY;
}

function resolveHeadlineLineColor(
  token: string | undefined,
  theme: ResolvedFrameTheme
): string {
  const { primary, accent, gold, green } = theme.colors;

  if (theme.paint.headlineColors === "token-or-white") {
    switch (token) {
      case "accent":
        return accent;
      case "gold":
        return gold;
      case "green":
        return green;
      default:
        return "#ffffff";
    }
  }

  if (theme.paint.headlineColors === "token-or-poster") {
    switch (token) {
      case "accent":
        return accent;
      case "gold":
        return gold;
      case "green":
        return green;
      default:
        return getPosterTextColor(theme);
    }
  }
  return resolvePosterTextColor(token, primary, accent, gold, green);
}

function drawHeadlineBlockCentered(
  ctx: CanvasRenderingContext2D,
  lines: PosterHeadlineLine[],
  centerX: number,
  startY: number,
  maxWidth: number,
  theme: ResolvedFrameTheme,
  fontScale = 1
): number {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  let currentY = startY;
  for (const line of lines) {
    ctx.fillStyle = resolveHeadlineLineColor(line.color, theme);
    ctx.font = frameFont(
      theme,
      700,
      Math.round(theme.paint.type.headlineSize * fontScale)
    );
    const wrapped = splitTextIntoLines(ctx, line.text, maxWidth);
    for (const segment of wrapped) {
      ctx.fillText(segment, centerX, currentY);
      currentY += Math.round(theme.paint.type.headlineLine * fontScale);
    }
  }
  return currentY;
}

function drawAttendeeDetailsBlock(
  ctx: CanvasRenderingContext2D,
  role: string,
  city: string,
  x: number,
  y: number,
  theme: ResolvedFrameTheme,
  fontScale = 1
): number {
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = getPosterTextColor(theme);
  ctx.font = frameFont(theme, 600, Math.round(26 * fontScale));

  let lineY = y;
  let bottomY = y - Math.round(8 * fontScale);
  if (role) {
    ctx.fillText(role.toUpperCase(), x, lineY);
    bottomY = lineY + Math.round(26 * fontScale * 0.35);
    lineY += Math.round(30 * fontScale);
  }
  if (city) {
    ctx.fillText(city.toUpperCase(), x, lineY);
    bottomY = lineY + Math.round(26 * fontScale * 0.35);
  }
  return bottomY;
}

function drawGroupCityBlockCentered(
  ctx: CanvasRenderingContext2D,
  city: string,
  centerX: number,
  y: number,
  theme: ResolvedFrameTheme,
  fontScale = 1
): number {
  const cityLabel = city.trim();
  if (!cityLabel) return y - Math.round(8 * fontScale);

  const textColor = getPosterTextColor(theme);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = textColor;

  const cityFontSize = Math.round(26 * fontScale);
  ctx.font = frameFont(theme, 600, cityFontSize);
  ctx.fillText(cityLabel.toUpperCase(), centerX, y);
  return y + Math.round(cityFontSize * 0.35);
}

function drawAttendeeBlock(
  ctx: CanvasRenderingContext2D,
  name: string,
  role: string,
  city: string,
  x: number,
  y: number,
  theme: ResolvedFrameTheme,
  fontScale = 1
): number {
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = getPosterTextColor(theme);
  ctx.font = frameFont(theme, 700, Math.round(40 * fontScale));
  const upperName = name.toUpperCase();
  ctx.fillText(upperName, x, y);

  ctx.strokeStyle = getPosterTextColor(theme);
  ctx.lineWidth = Math.max(2, 3 * fontScale);
  const underlineY = y + Math.round(10 * fontScale);
  ctx.beginPath();
  ctx.moveTo(x, underlineY);
  ctx.lineTo(
    x + Math.min(ctx.measureText(upperName).width, 420 * fontScale),
    underlineY
  );
  ctx.stroke();

  ctx.font = frameFont(theme, 600, Math.round(26 * fontScale));
  let lineY = y + Math.round(44 * fontScale);
  let bottomY = underlineY;
  if (role) {
    ctx.fillText(role.toUpperCase(), x, lineY);
    bottomY = lineY + Math.round(26 * fontScale * 0.35);
    lineY += Math.round(30 * fontScale);
  }
  if (city) {
    ctx.fillText(city.toUpperCase(), x, lineY);
    bottomY = lineY + Math.round(26 * fontScale * 0.35);
  }
  return bottomY;
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
  ctx.font = frameFont(theme, 700, nameFontSize);
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
  ctx.font = frameFont(theme, 600, roleFontSize);
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

type MiddleSectionPlacement = {
  contentX: number;
  maxWidth: number;
  align?: "left" | "center";
};

function drawPersonalNameBlock(
  ctx: CanvasRenderingContext2D,
  displayName: string,
  taglines: string[],
  y: number,
  layout: PosterLayoutContext,
  canvasW: number,
  theme: ResolvedFrameTheme,
  placement: MiddleSectionPlacement,
  fontScale = 1
): number {
  const padX =
    placement.align === "center"
      ? placement.contentX - placement.maxWidth / 2
      : placement.contentX;
  const maxRight = padX + placement.maxWidth;
  const contentY = y;
  const activeTaglines = taglines.map((t) => t.trim()).filter(Boolean);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  const nameColor = theme.paint.nameColor;
  const taglineColor = getPosterTextColor(theme);

  const nameFontSize = Math.round(theme.paint.type.personalNameSize * fontScale);
  const upperName = displayName.trim().toUpperCase();
  let nameWidth = 0;
  let nameBottom = contentY;

  if (upperName) {
    ctx.fillStyle = nameColor;
    ctx.font = frameFont(theme, 700, nameFontSize);
    const nameLines = splitTextIntoLines(ctx, upperName, placement.maxWidth);
    let lineY = contentY;
    for (const line of nameLines) {
      fillTextWithSpaces(ctx, line, padX, lineY);
      nameWidth = Math.max(nameWidth, measureLineWidth(ctx, line));
      nameBottom = lineY;
      lineY += Math.round(nameFontSize * 1.08);
    }
  }

  if (activeTaglines.length === 0) {
    if (!upperName) return y;
    return nameBottom + Math.round(nameFontSize * 0.28);
  }

  const tagFontSize = Math.round(theme.paint.type.personalTaglineSize * fontScale);
  const tagGap = layoutScale(layout, 18, canvasW);
  ctx.fillStyle = taglineColor;
  ctx.font = frameFont(theme, 600, tagFontSize);

  const nameIsSingleLine = upperName && nameBottom === contentY;
  let tagX = nameIsSingleLine ? padX + nameWidth + tagGap : padX;
  let fitsOnRow = Boolean(nameIsSingleLine);
  let totalWidth = nameIsSingleLine ? nameWidth + tagGap : 0;
  for (const tag of activeTaglines) {
    totalWidth += measureLineWidth(ctx, tag) + tagGap;
  }
  if (padX + totalWidth > maxRight) {
    fitsOnRow = false;
  }

  if (fitsOnRow) {
    for (const tag of activeTaglines) {
      fillTextWithSpaces(ctx, tag, tagX, contentY);
      tagX += measureLineWidth(ctx, tag) + tagGap;
    }
    return contentY + Math.round(Math.max(nameFontSize, tagFontSize) * 0.4);
  }

  let lineY = nameBottom + Math.round(nameFontSize * 0.45);
  for (const tag of activeTaglines) {
    fillTextWithSpaces(ctx, tag, padX, lineY);
    lineY += Math.round(30 * fontScale);
  }
  return lineY + Math.round(4 * fontScale);
}

function drawMiddleSectionWithName(
  ctx: CanvasRenderingContext2D,
  displayName: string,
  taglines: string[],
  y: number,
  layout: PosterLayoutContext,
  canvasW: number,
  theme: ResolvedFrameTheme,
  placement: MiddleSectionPlacement,
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

  const contentY = y + Math.round(TAGLINE_AFTER_DIVIDER_GAP * fontScale);
  return drawPersonalNameBlock(
    ctx,
    displayName,
    taglines,
    contentY,
    layout,
    canvasW,
    theme,
    placement,
    fontScale
  );
}

/** Name beside the photo, then headline/tagline in the same column. */
function drawPersonalBesidePhotoTextStack(
  ctx: CanvasRenderingContext2D,
  input: {
    headline: PosterHeadlineLine[];
    gsTagline?: string;
    displayName: string;
    middleTaglines: string[];
  },
  layoutCtx: {
    textX: number;
    textMaxWidth: number;
    photoY: number;
    photoRadius: number;
    ringOuterInset: number;
    layout: PosterLayoutContext;
    canvasW: number;
    theme: ResolvedFrameTheme;
    fontScale?: number;
    includeGsTagline?: boolean;
    textStartY?: number;
    textGap?: number;
  }
): number {
  const {
    textX,
    textMaxWidth,
    photoY,
    photoRadius,
    ringOuterInset,
    layout,
    canvasW,
    theme,
    fontScale = 1,
    includeGsTagline = false,
    textGap,
  } = layoutCtx;
  const placement = { contentX: textX, maxWidth: textMaxWidth };
  const gap =
    textGap ?? layoutScale(layout, includeGsTagline ? 16 : 8, canvasW);
  const nameFontSize = Math.round(theme.paint.type.personalNameSize * fontScale);
  const photoTopY = resolvePersonalTextColumnTopY(
    photoY,
    photoRadius,
    ringOuterInset,
    fontScale
  );
  let nameY =
    photoY - Math.round(photoRadius * 0.18) + Math.round(nameFontSize * 0.35);
  nameY = Math.max(photoTopY + Math.round(nameFontSize * 0.82), nameY);
  if (theme.paint.nameLift) {
    nameY -= Math.round(theme.paint.nameLift * fontScale);
  }

  const nameBottom = drawPersonalNameBlock(
    ctx,
    input.displayName,
    input.middleTaglines,
    nameY,
    layout,
    canvasW,
    theme,
    placement,
    fontScale
  );

  let textY = nameBottom + gap;

  if (input.headline.length > 0) {
    const headlineGaps = includeGsTagline
      ? [
          layoutScale(layout, 20, canvasW),
          layoutScale(layout, 20, canvasW),
        ]
      : [];
    textY = drawHeadlineBlock(
      ctx,
      input.headline,
      textX,
      textY,
      theme,
      textMaxWidth,
      fontScale,
      headlineGaps
    );
    textY += gap;
  }

  if (includeGsTagline && input.gsTagline?.trim()) {
    textY = drawGsHeadlineTagline(
      ctx,
      input.gsTagline,
      textX,
      textY,
      textMaxWidth,
      fontScale,
      undefined,
      theme
    );
  }

  return Math.max(textY, nameBottom);
}

function drawTicketFooterBar(
  ctx: CanvasRenderingContext2D,
  y: number,
  height: number,
  layout: PosterLayoutContext,
  canvasW: number,
  theme: ResolvedFrameTheme,
  ticketUrl: string,
  fontScale = 1
) {
  const barX = layoutX(layout, scaleCoord(36, canvasW), canvasW);
  const barW = layout.innerW;
  const label = formatPosterTicketLabel(ticketUrl);

  ctx.fillStyle = theme.colors.accent;
  ctx.fillRect(barX, y, barW, height);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "ltr";
  let fontSize = Math.round(22 * fontScale);
  const maxWidth = barW - Math.round(24 * fontScale);
  ctx.font = frameFont(theme, 700, fontSize);
  while (fontSize > Math.round(14 * fontScale) && ctx.measureText(label).width > maxWidth) {
    fontSize -= 1;
    ctx.font = frameFont(theme, 700, fontSize);
  }
  ctx.fillText(label, canvasW / 2, y + height / 2);
}

function getPosterFooterStartY(
  contentBottomY: number,
  layout: PosterLayoutContext,
  canvasW: number
): number {
  return contentBottomY + middleToFooterGap(layout, canvasW);
}

function drawStatsBar(
  ctx: CanvasRenderingContext2D,
  stats: PosterStat[],
  y: number,
  theme: ResolvedFrameTheme,
  layout: PosterLayoutContext,
  canvasW: number
) {
  const { primary, accent, gold, green } = theme.colors;
  const barH = 118;
  const barX = layoutX(layout, scaleCoord(36, canvasW), canvasW);
  const barW = layout.innerW;
  const blockW = barW / stats.length;

  stats.forEach((stat, i) => {
    const x = barX + i * blockW;
    let color = resolvePosterColor(stat.color, primary, accent, gold, green);
    if (color === primary) color = accent;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, blockW, barH);

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.direction = "ltr";
    ctx.fillStyle = "#ffffff";
    ctx.font = frameFont(theme, 700, 34);
    ctx.fillText(stat.value, x + blockW / 2, y + 52);

    ctx.font = frameFont(theme, 500, 18);
    ctx.fillText(stat.label, x + blockW / 2, y + 86);
  });

  return y + barH;
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
  ctx.font = frameFont(theme, 500, 22);
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
  maxBarHeight?: number,
  fontScale = 1
): number {
  const barX = layoutX(layout, scaleCoord(36, canvasW), canvasW);
  const barW = layout.innerW;
  const paddingX = 48;
  const maxTextWidth = barW - paddingX;
  const verticalPad = 12;

  let fontSize = 26;
  ctx.font = frameFont(theme, 700, fontSize);
  let lines = splitTextIntoLines(ctx, message, maxTextWidth);
  let lineHeight = Math.round(fontSize * 1.1);
  let barH = Math.max(50, lines.length * lineHeight + verticalPad * 2);

  while (fontSize > 16) {
    const tooWide = lines.some((line) => ctx.measureText(line).width > maxTextWidth);
    const tooTall = maxBarHeight != null && barH > maxBarHeight;
    if (!tooWide && !tooTall) break;
    fontSize -= 1;
    ctx.font = frameFont(theme, 700, fontSize);
    lines = splitTextIntoLines(ctx, message, maxTextWidth);
    lineHeight = Math.round(fontSize * 1.1);
    barH = Math.max(46, lines.length * lineHeight + verticalPad * 2);
  }

  ctx.fillStyle = theme.colors.accent;
  ctx.fillRect(barX, y, barW, barH);

  ctx.fillStyle = "#ffffff";
  ctx.font = frameFont(theme, 700, fontSize);
  const firstLineY = y + verticalPad + fontSize * 0.78;
  wrapCanvasText(ctx, message, canvasW / 2, firstLineY, maxTextWidth, lineHeight);

  return y + barH;
}

function highlightBlockColumns(count: number): number {
  if (count <= 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 2;
  return 3;
}

function drawHighlightBlocks(
  ctx: CanvasRenderingContext2D,
  highlights: string[],
  y: number,
  layout: PosterLayoutContext,
  canvasW: number,
  theme: ResolvedFrameTheme,
  maxBottomY?: number,
  fontScale = 1
): number {
  if (highlights.length === 0) return y;

  const barX = layoutX(layout, scaleCoord(36, canvasW), canvasW);
  const barW = layout.innerW;
  const gap = Math.round(HIGHLIGHT_BLOCK_GAP * fontScale);
  const cols = highlightBlockColumns(highlights.length);
  const rows = Math.ceil(highlights.length / cols);
  const blockW = (barW - gap * (cols - 1)) / cols;
  const blockPad = Math.round(10 * fontScale);
  const lineGap = Math.round(4 * fontScale);

  let fontSize = Math.round(HIGHLIGHTS_FONT_SIZE * fontScale);
  const minFontSize = Math.round(HIGHLIGHTS_MIN_FONT_SIZE * fontScale);

  const measureLayout = () => {
    ctx.font = frameFont(theme, 600, fontSize);
    const lineHeight = Math.round((HIGHLIGHTS_LINE_HEIGHT / HIGHLIGHTS_FONT_SIZE) * fontSize);
    let maxBlockH = Math.round(HIGHLIGHT_BLOCK_MIN_H * fontScale);
    for (const item of highlights) {
      const lines = item.split("\n").map((l) => l.trim()).filter(Boolean);
      const textH = lines.length * lineHeight + Math.max(0, lines.length - 1) * lineGap;
      maxBlockH = Math.max(maxBlockH, textH + blockPad * 2);
    }
    const gridH = rows * maxBlockH + Math.max(0, rows - 1) * gap;
    return { lineHeight, maxBlockH, gridH };
  };

  let { lineHeight, maxBlockH, gridH } = measureLayout();
  if (maxBottomY) {
    while (y + gridH > maxBottomY && fontSize > minFontSize) {
      fontSize -= 1;
      ({ lineHeight, maxBlockH, gridH } = measureLayout());
    }
  }

  ctx.font = frameFont(theme, 600, fontSize);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";

  let cursorY = y;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      if (index >= highlights.length) break;

      const blockX = barX + col * (blockW + gap);
      const blockY = cursorY;

      ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
      ctx.fillRect(blockX, blockY, blockW, maxBlockH);
      ctx.strokeStyle = theme.colors.accent;
      ctx.lineWidth = Math.max(1, Math.round(2 * fontScale));
      ctx.strokeRect(blockX + 0.5, blockY + 0.5, blockW - 1, maxBlockH - 1);

      const lines = highlights[index]
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const textBlockH =
        lines.length * lineHeight + Math.max(0, lines.length - 1) * lineGap;
      let textY =
        blockY + (maxBlockH - textBlockH) / 2 + lineHeight * 0.82;

      ctx.fillStyle = getPosterTextColor(theme);
      for (const line of lines) {
        const wrapped = splitTextIntoLines(ctx, line, blockW - blockPad * 2);
        for (const segment of wrapped) {
          ctx.fillText(segment, blockX + blockW / 2, textY);
          textY += lineHeight + lineGap;
        }
      }
    }
    cursorY += maxBlockH + gap;
  }

  return maxBottomY != null ? Math.min(cursorY - gap, maxBottomY) : cursorY - gap;
}

function drawPosterFooterSection(
  ctx: CanvasRenderingContext2D,
  event: EventWithOptions,
  theme: ResolvedFrameTheme,
  middleEndY: number,
  layout: PosterLayoutContext,
  canvasW: number,
  canvasH: number,
  fontScale = 1
) {
  const config = parsePosterTemplate(event);
  const stats = config.stats ?? [];
  const countdown = getEventCountdown(event);
  const highlights = parseEventHighlights(event.eventHighlights);
  const ticketUrl = getPosterTicketUrl(config);
  const hasLegacyFooter = Boolean(config.website || config.socialHandle);
  const ticketBarH = ticketUrl ? Math.round(TICKET_FOOTER_H * fontScale) : 0;
  const legacyFooterH = hasLegacyFooter && !ticketUrl ? 36 : 0;
  const statsBarH = stats.length > 0 ? 118 : 0;
  const footerBarH = ticketBarH || legacyFooterH;
  const footerTop = canvasH - layout.inset - footerBarH - 6;
  const highlightsMaxBottom = footerTop - statsBarH - 10;
  const sectionGap = 6;

  let cursorY = middleEndY + sectionGap;

  if (countdown && highlights.length > 0) {
    const totalAvailable = Math.max(100, highlightsMaxBottom - cursorY);
    const countdownMaxH = Math.min(62, Math.floor(totalAvailable * 0.35));
    cursorY =
      drawCountdownBanner(
        ctx,
        countdown.message,
        cursorY,
        theme,
        layout,
        canvasW,
        countdownMaxH,
        fontScale
      ) + sectionGap;
  } else if (countdown) {
    cursorY =
      drawCountdownBanner(
        ctx,
        countdown.message,
        cursorY,
        theme,
        layout,
        canvasW,
        undefined,
        fontScale
      ) + sectionGap;
  }

  if (highlights.length > 0) {
    cursorY =
      drawHighlightBlocks(
        ctx,
        highlights,
        cursorY,
        layout,
        canvasW,
        theme,
        highlightsMaxBottom,
        fontScale
      ) + sectionGap;
  }

  if (stats.length > 0) {
    cursorY =
      drawStatsBar(ctx, stats, cursorY + 4, theme, layout, canvasW) + 8;
    if (ticketUrl) {
      drawTicketFooterBar(
        ctx,
        footerTop,
        ticketBarH,
        layout,
        canvasW,
        theme,
        ticketUrl,
        fontScale
      );
    } else {
      drawFooter(
        ctx,
        cursorY,
        Math.max(legacyFooterH, canvasH - layout.inset - cursorY),
        theme.colors.accent,
        layout,
        canvasW,
        theme,
        config.website,
        config.socialHandle
      );
    }
    return;
  }

  if (ticketUrl) {
    drawTicketFooterBar(
      ctx,
      footerTop,
      ticketBarH,
      layout,
      canvasW,
      theme,
      ticketUrl,
      fontScale
    );
    return;
  }

  if (hasLegacyFooter) {
    drawFooter(
      ctx,
      footerTop,
      legacyFooterH,
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
  const headline = getPosterHeadline(config, event);
  const hashtag = getPosterHashtag(config, event);
  const themeKey = theme.overlayKey ?? theme.key;
  const useOverlayHole = isOverlayHoleLayout(theme);
  const useOneWorld = isOneWorldLayout(theme);
  const useGsContent = usesGsContentLayout(theme);
  const layout = theme.paint.fullBleedLayout
    ? getPosterLayout(null, POSTER_W, POSTER_H)
    : getPosterLayout(themeKey, POSTER_W, POSTER_H);

  paintFrameBackground(ctx, theme, POSTER_W, POSTER_H);

  const displayName = `${input.firstName} ${input.lastName}`.trim();

  if (useOverlayHole) {
    drawOverlayHolePhoto(
      ctx,
      theme,
      photo,
      input.photoCrop,
      POSTER_W,
      POSTER_H
    );
  } else if (useOneWorld) {
    drawOneWorldPersonalPoster(
      ctx,
      event,
      theme,
      photo,
      input.photoCrop,
      displayName,
      POSTER_W,
      POSTER_H
    );
  } else if (useGsContent) {
    const headerBottomY = drawGsCompactHeader(
      ctx,
      event,
      logo,
      theme,
      layout,
      POSTER_W,
      POSTER_H,
      hashtag
    );

    const photoX = resolveLeftPhotoX(layout, POSTER_W);
    const photoRadius = layoutScale(
      layout,
      PERSONAL_PHOTO_POSITION.radius,
      POSTER_W
    );
    const ringPadding = layoutScale(
      layout,
      PERSONAL_PHOTO_POSITION.ringPadding,
      POSTER_W
    );
    const ringOuterInset = getPhotoRingOuterInset(ringPadding, 1, theme);
    const photoY = resolvePhotoCenterY(
      headerBottomY,
      photoRadius,
      ringOuterInset,
      layout,
      POSTER_W,
      POSTER_H
    );

    if (theme.paint.photoWarmAccent) {
      paintGsPhotoWarmAccent(
        ctx,
        photoX,
        photoY,
        photoRadius,
        ringOuterInset
      );
    }

    drawCircularImage(ctx, photo, photoX, photoY, photoRadius, input.photoCrop);
    drawAttendeePhotoRing(ctx, photoX, photoY, photoRadius, ringPadding, theme);

    const { textX, textMaxWidth } = resolveGsTextColumnLayout(
      layout,
      POSTER_W,
      photoX,
      photoRadius,
      ringOuterInset
    );
    const middleTaglines = parseMiddleTaglines(event.middleTaglines);
    const attendeeBottomY = drawPersonalBesidePhotoTextStack(
      ctx,
      {
        headline,
        gsTagline: event.tagline,
        displayName,
        middleTaglines,
      },
      {
        textX,
        textMaxWidth,
        photoY,
        photoRadius,
        ringOuterInset,
        layout,
        canvasW: POSTER_W,
        theme,
        fontScale: theme.paint.besidePhotoScale,
        includeGsTagline: theme.paint.includeEventTagline,
        textStartY: headerBottomY + layoutScale(layout, 70, POSTER_W),
        textGap: layoutScale(layout, 18, POSTER_W),
      }
    );
    const photoBottomY =
      photoY + photoRadius + ringOuterInset + layoutScale(layout, 16, POSTER_W);
    const blockBottomY = Math.max(attendeeBottomY, photoBottomY);

    await drawGsPosterFooter(
      ctx,
      event,
      theme,
      getPosterFooterStartY(blockBottomY, layout, POSTER_W),
      layout,
      POSTER_W,
      POSTER_H,
      1,
      1080,
      1080,
      "personal",
      input.attendeeCount
    );
  } else {
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

    const photoX = resolveLeftPhotoX(layout, POSTER_W);
    const photoRadius = layoutScale(layout, PERSONAL_PHOTO_POSITION.radius, POSTER_W);
    const ringPadding = layoutScale(layout, PERSONAL_PHOTO_POSITION.ringPadding, POSTER_W);
    const ringOuterInset = getPhotoRingOuterInset(ringPadding, 1, theme);
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

    const textX = resolveTextColumnX(
      photoX,
      photoRadius,
      ringOuterInset,
      layout,
      POSTER_W
    );
    const textMaxWidth = Math.max(
      160,
      POSTER_W - textX - layout.inset - layoutScale(layout, 24, POSTER_W)
    );
    const middleTaglines = parseMiddleTaglines(event.middleTaglines);
    const attendeeBottomY = drawPersonalBesidePhotoTextStack(
      ctx,
      {
        headline,
        displayName,
        middleTaglines,
      },
      {
        textX,
        textMaxWidth,
        photoY,
        photoRadius,
        ringOuterInset,
        layout,
        canvasW: POSTER_W,
        theme,
      }
    );
    const photoBottomY =
      photoY + photoRadius + ringOuterInset + layoutScale(layout, 16, POSTER_W);
    const blockBottomY = Math.max(attendeeBottomY, photoBottomY);

    drawPosterFooterSection(
      ctx,
      event,
      theme,
      getPosterFooterStartY(blockBottomY, layout, POSTER_W),
      layout,
      POSTER_W,
      POSTER_H
    );
  }

  if (theme.paint.paintOverlay) {
    await paintFrameOverlay(ctx, theme, POSTER_W, POSTER_H);
  }
  if (useOverlayHole) {
    drawOverlayHoleName(ctx, theme, displayName, POSTER_W, POSTER_H);
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
  drawPosterAttribution(ctx, theme, POSTER_W, POSTER_H);
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
  const groupTagline = getEventGenderTagline(event, "group");
  const headline = getPosterHeadline(config, event, groupTagline);
  const themeKey = theme.overlayKey ?? theme.key;
  const useOverlayHole = isOverlayHoleLayout(theme);
  const useOneWorld = isOneWorldLayout(theme);
  const useGsContent = usesGsContentLayout(theme);
  const layout = theme.paint.fullBleedLayout
    ? getPosterLayout(null, POSTER_W, POSTER_H)
    : getPosterLayout(themeKey, POSTER_W, POSTER_H);

  paintFrameBackground(ctx, theme, POSTER_W, POSTER_H);

  const groupName = input.groupName.trim() || "Our Group";

  if (useOverlayHole) {
    drawOverlayHolePhoto(
      ctx,
      theme,
      photos[0],
      input.photoCrops[0],
      POSTER_W,
      POSTER_H
    );
  } else if (useOneWorld) {
    drawOneWorldGroupPoster(
      ctx,
      event,
      theme,
      photos,
      input.photoCrops,
      groupName,
      POSTER_W,
      POSTER_H
    );
  } else if (useGsContent) {
    const headerBottomY = drawGsCompactHeader(
      ctx,
      event,
      logo,
      theme,
      layout,
      POSTER_W,
      POSTER_H,
      hashtag
    );

    let headerContentBottomY = headerBottomY + layoutScale(layout, 8, POSTER_W);
    if (headline.length > 0) {
      headerContentBottomY = drawHeadlineBlockCentered(
        ctx,
        headline,
        POSTER_W / 2,
        headerContentBottomY,
        layout.innerW - 80,
        theme
      );
      drawGsHeadlineTagline(
        ctx,
        event.tagline,
        0,
        headerContentBottomY + 6,
        layout.innerW - 48,
        1,
        POSTER_W / 2,
        theme
      );
    }

    const ringOuterInset = getPhotoRingOuterInset(5, 1, theme);
    const basePositions = getGroupPhotoPositions(input.memberCount).map((pos) => ({
      x: layoutX(layout, pos.x, POSTER_W),
      y: layoutY(layout, pos.y, POSTER_H),
      r: layoutScale(layout, pos.r, POSTER_W),
    }));
    const photoTopY = Math.min(
      ...basePositions.map((pos) => pos.y - pos.r - ringOuterInset)
    );
    const photoYOffset = resolvePhotoRowYOffset(
      headerContentBottomY + 40,
      photoTopY,
      layout,
      POSTER_W
    );
    const positions = basePositions.map((pos) => ({
      ...pos,
      y: pos.y + photoYOffset,
    }));

    if (theme.paint.photoWarmAccent) {
      paintGsGroupPhotosWarmAccent(ctx, positions, ringOuterInset);
    }

    photos.forEach((photo, i) => {
      const pos = positions[i];
      const crop = input.photoCrops[i];
      drawCircularImage(ctx, photo, pos.x, pos.y, pos.r, crop);
      drawAttendeePhotoRing(ctx, pos.x, pos.y, pos.r, 5, theme);
    });

    const photoCenterX =
      positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
    const avgPhotoY =
      positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;
    const avgPhotoRadius =
      positions.reduce((sum, pos) => sum + pos.r, 0) / positions.length;
    const photoBottom =
      Math.max(
        ...positions.map((pos) => pos.y + pos.r + getPhotoRingOuterInset(5, 1, theme))
      ) + layoutScale(layout, 16, POSTER_W);

    const groupName = input.groupName.trim() || "Our Group";
    const middleTaglines = parseMiddleTaglines(event.middleTaglines);
    const middleY = resolveMiddleBesidePhotoY(
      avgPhotoY,
      avgPhotoRadius,
      headerContentBottomY + 40,
      layout,
      POSTER_W,
      POSTER_H
    );
    const groupMaxWidth = layout.innerW - 80;
    const contentBottomY = drawMiddleSectionWithName(
      ctx,
      groupName,
      middleTaglines,
      middleY,
      layout,
      POSTER_W,
      theme,
      { contentX: photoCenterX, maxWidth: groupMaxWidth, align: "center" }
    );
    const blockBottomY = Math.max(contentBottomY, photoBottom);

    await drawGsPosterFooter(
      ctx,
      event,
      theme,
      getPosterFooterStartY(blockBottomY, layout, POSTER_W),
      layout,
      POSTER_W,
      POSTER_H,
      1,
      1080,
      1080,
      "group",
      input.attendeeCount
    );
  } else {
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

    const ringOuterInset = getPhotoRingOuterInset(5, 1, theme);
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
    const avgPhotoY =
      positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;
    const avgPhotoRadius =
      positions.reduce((sum, pos) => sum + pos.r, 0) / positions.length;
    const photoBottom =
      Math.max(
        ...positions.map((pos) => pos.y + pos.r + getPhotoRingOuterInset(5, 1, theme))
      ) + layoutScale(layout, 16, POSTER_W);

    const groupName = input.groupName.trim() || "Our Group";
    const middleTaglines = parseMiddleTaglines(event.middleTaglines);
    const middleY = resolveMiddleBesidePhotoY(
      avgPhotoY,
      avgPhotoRadius,
      headerContentBottomY,
      layout,
      POSTER_W,
      POSTER_H
    );
    const groupMaxWidth = layout.innerW - 80;
    const contentBottomY = drawMiddleSectionWithName(
      ctx,
      groupName,
      middleTaglines,
      middleY,
      layout,
      POSTER_W,
      theme,
      { contentX: photoCenterX, maxWidth: groupMaxWidth, align: "center" }
    );
    const blockBottomY = Math.max(contentBottomY, photoBottom);

    drawPosterFooterSection(
      ctx,
      event,
      theme,
      getPosterFooterStartY(blockBottomY, layout, POSTER_W),
      layout,
      POSTER_W,
      POSTER_H
    );
  }

  if (theme.paint.paintOverlay) {
    await paintFrameOverlay(ctx, theme, POSTER_W, POSTER_H);
  }
  if (useOverlayHole) {
    drawOverlayHoleName(ctx, theme, groupName, POSTER_W, POSTER_H);
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
  drawPosterAttribution(ctx, theme, POSTER_W, POSTER_H);
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
  const headline = getPosterHeadline(config, event);
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

  const photoX = resolveLeftPhotoX(layout, DP_W);
  const photoRadius = layoutScale(
    layout,
    scaleCoord(PERSONAL_PHOTO_POSITION.radius, DP_W),
    DP_W
  );
  const ringPadding = layoutScale(
    layout,
    scaleCoord(PERSONAL_PHOTO_POSITION.ringPadding, DP_W),
    DP_W
  );
  const ringOuterInset = getPhotoRingOuterInset(ringPadding, fontScale, theme);
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

  const textX = resolveTextColumnX(
    photoX,
    photoRadius,
    ringOuterInset,
    layout,
    DP_W
  );
  const textMaxWidth = Math.max(
    120,
    DP_W - textX - layout.inset - layoutScale(layout, scaleCoord(24, DP_W), DP_W)
  );
  const middleTaglines = parseMiddleTaglines(event.middleTaglines);
  const attendeeBottomY = drawPersonalBesidePhotoTextStack(
    ctx,
    {
      headline,
      displayName,
      middleTaglines,
    },
    {
      textX,
      textMaxWidth,
      photoY,
      photoRadius,
      ringOuterInset,
      layout,
      canvasW: DP_W,
      theme,
      fontScale,
    }
  );
  const photoBottomY =
    photoY +
    photoRadius +
    ringOuterInset +
    layoutScale(layout, scaleCoord(16, DP_W), DP_W);
  const blockBottomY = Math.max(attendeeBottomY, photoBottomY);

  drawPosterFooterSection(
    ctx,
    event,
    theme,
    getPosterFooterStartY(blockBottomY, layout, DP_W),
    layout,
    DP_W,
    DP_H,
    fontScale
  );

  await paintFrameOverlay(ctx, theme, DP_W, DP_H);
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

  const ringOuterInset = getPhotoRingOuterInset(5, fontScale, theme);
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
  const avgPhotoY =
    positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;
  const avgPhotoRadius =
    positions.reduce((sum, pos) => sum + pos.r, 0) / positions.length;
  const photoBottom =
    Math.max(
      ...positions.map((pos) =>
        pos.y + pos.r + getPhotoRingOuterInset(5, fontScale, theme)
      )
    ) +
    layoutScale(layout, scaleCoord(16, DP_W), DP_W);

  const groupName = input.groupName.trim() || "Our Group";
  const middleTaglines = parseMiddleTaglines(event.middleTaglines);
  const middleY = resolveMiddleBesidePhotoY(
    avgPhotoY,
    avgPhotoRadius,
    headerBottomY,
    layout,
    DP_W,
    DP_H
  );
  const groupMaxWidth = layout.innerW - layoutScale(layout, scaleCoord(80, DP_W), DP_W);
  const contentBottomY = drawMiddleSectionWithName(
    ctx,
    groupName,
    middleTaglines,
    middleY,
    layout,
    DP_W,
    theme,
    { contentX: photoCenterX, maxWidth: groupMaxWidth, align: "center" },
    fontScale
  );
  const blockBottomY = Math.max(contentBottomY, photoBottom);

  drawPosterFooterSection(
    ctx,
    event,
    theme,
    getPosterFooterStartY(blockBottomY, layout, DP_W),
    layout,
    DP_W,
    DP_H,
    fontScale
  );

  await paintFrameOverlay(ctx, theme, DP_W, DP_H);
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
  if (isOneWorldLayout(theme)) {
    const displayName = `${input.firstName} ${input.lastName}`.trim();
    drawOneWorldPersonalDp(
      ctx,
      input.event,
      theme,
      photo,
      input.photoCrop,
      displayName,
      DP_W,
      DP_H
    );
    return;
  }
  if (isOverlayHoleLayout(theme)) {
    const displayName = `${input.firstName} ${input.lastName}`.trim();
    drawOverlayHolePhoto(ctx, theme, photo, input.photoCrop, DP_W, DP_H);
    await paintFrameOverlay(ctx, theme, DP_W, DP_H);
    drawOverlayHoleName(ctx, theme, displayName, DP_W, DP_H);
    return;
  }
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
  if (isOneWorldLayout(theme)) {
    drawOneWorldGroupDp(
      ctx,
      input.event,
      theme,
      photos,
      input.photoCrops,
      input.groupName.trim() || "Our Group",
      DP_W,
      DP_H
    );
    return;
  }
  if (isOverlayHoleLayout(theme)) {
    const groupName = input.groupName.trim() || "Our Group";
    drawOverlayHolePhoto(ctx, theme, photos[0], input.photoCrops[0], DP_W, DP_H);
    await paintFrameOverlay(ctx, theme, DP_W, DP_H);
    drawOverlayHoleName(ctx, theme, groupName, DP_W, DP_H);
    return;
  }
  await drawGroupDp(ctx, input, logo, photos, theme, layout);
}

export async function generatePersonalAssets(
  input: PersonalInput
): Promise<GeneratedAssets> {
  const photoDataUrl = await fileToDataUrl(input.photo);
  const photo = await loadImage(photoDataUrl);

  const poster = document.createElement("canvas");
  await renderPersonalPosterCanvas(poster, input, photo);

  return {
    posterDataUrl: poster.toDataURL("image/png"),
  };
}

export async function generateGroupAssets(
  input: GroupInput
): Promise<GeneratedAssets> {
  const photoDataUrls = await Promise.all(input.photos.map(fileToDataUrl));
  const photos = await Promise.all(photoDataUrls.map(loadImage));

  const poster = document.createElement("canvas");
  await renderGroupPosterCanvas(poster, input, photos);

  return {
    posterDataUrl: poster.toDataURL("image/png"),
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
