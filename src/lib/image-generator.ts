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
  x: 320,
  y: 300,
  radius: 155,
  ringPadding: 8,
};

export type PersonalDpRenderInput = PersonalPosterRenderInput;
export type GroupDpRenderInput = GroupPosterRenderInput;

function getGenderTagline(event: EventWithOptions, genderKey: string) {
  return event.genderOptions.find((o) => o.key === genderKey)?.tagline ?? "";
}

async function loadQrCode(url: string): Promise<HTMLImageElement | null> {
  try {
    const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=128x128&margin=0&data=${encodeURIComponent(url)}`;
    return await loadImage(qrApi);
  } catch {
    return null;
  }
}

function getQrUrl(event: EventWithOptions, configQr?: string): string | undefined {
  if (configQr) return configQr;
  if (typeof window !== "undefined") {
    return `${window.location.origin}/events/${event.slug}/personal`;
  }
  return undefined;
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

const POSTER_TEXT = "#ffffff";

function drawBmmHeader(
  ctx: CanvasRenderingContext2D,
  event: EventWithOptions,
  logo: HTMLImageElement,
  theme: ResolvedFrameTheme,
  layout: PosterLayoutContext,
  canvasW: number,
  canvasH: number,
  hashtag?: string
) {
  drawLogoAt(
    ctx,
    logo,
    layoutX(layout, 36, canvasW),
    layoutY(layout, 58, canvasH),
    96,
    96
  );

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = POSTER_TEXT;
  ctx.font = posterFont(700, 46);
  ctx.fillText(event.name.toUpperCase(), canvasW / 2, layoutY(layout, 40, canvasH));

  ctx.font = posterFont(600, 26);
  ctx.fillText(getPosterVenueLine(event), canvasW / 2, layoutY(layout, 112, canvasH));

  if (hashtag) {
    ctx.textAlign = "right";
    ctx.font = posterFont(700, 28);
    ctx.fillText(hashtag, canvasW - layout.inset, layoutY(layout, 50, canvasH));
  }
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
  ctx.fillStyle = POSTER_TEXT;
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
  ctx.fillStyle = POSTER_TEXT;
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
  theme: ResolvedFrameTheme
) {
  const { accent } = theme.colors;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = POSTER_TEXT;
  ctx.font = posterFont(700, 40);
  const upperName = name.toUpperCase();
  ctx.fillText(upperName, x, y);

  ctx.strokeStyle = POSTER_TEXT;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y + 10);
  ctx.lineTo(x + Math.min(ctx.measureText(upperName).width, 420), y + 10);
  ctx.stroke();

  ctx.font = posterFont(600, 26);
  let lineY = y + 44;
  if (role) {
    ctx.fillText(role.toUpperCase(), x, lineY);
    lineY += 30;
  }
  if (city) {
    ctx.fillText(city.toUpperCase(), x, lineY);
  }
}

function drawMiddleSection(
  ctx: CanvasRenderingContext2D,
  slogan: string,
  qr: HTMLImageElement | null,
  y: number,
  layout: PosterLayoutContext,
  canvasW: number
) {
  const lineStart = layoutX(layout, 36, canvasW);
  const lineEnd = layoutX(layout, canvasW - 36, canvasW);

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(lineStart, y);
  ctx.lineTo(lineEnd, y);
  ctx.stroke();

  const textY = y + 58;
  ctx.fillStyle = POSTER_TEXT;
  ctx.font = posterFont(600, 36);
  const textMaxWidth = qr ? canvasW - layout.inset * 2 - 220 : layout.innerW - 80;
  wrapCanvasText(ctx, slogan, canvasW / 2, textY, textMaxWidth, 44);

  if (qr) {
    const size = 96;
    const qrX = lineEnd - size;
    const qrY = y + 16;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(qrX - 4, qrY - 4, size + 8, size + 8);
    ctx.drawImage(qr, qrX, qrY, size, size);
  }
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

  ctx.fillStyle = "#ffffff";
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

const COUNTDOWN_BAR_H = 96;

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

  ctx.fillStyle = theme.colors.accent;
  ctx.fillRect(barX, y, barW, COUNTDOWN_BAR_H);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "ltr";
  let fontSize = 52;
  ctx.font = posterFont(700, fontSize);
  while (ctx.measureText(message).width > barW - 48 && fontSize > 28) {
    fontSize -= 1;
    ctx.font = posterFont(700, fontSize);
  }
  ctx.fillText(message, canvasW / 2, y + COUNTDOWN_BAR_H / 2);

  return y + COUNTDOWN_BAR_H;
}

function drawEventHighlights(
  ctx: CanvasRenderingContext2D,
  highlights: string[],
  y: number,
  layout: PosterLayoutContext,
  canvasW: number
): number {
  if (highlights.length === 0) return y;

  const maxWidth = layout.innerW - 48;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = POSTER_TEXT;
  ctx.font = posterFont(600, 26);

  let cursorY = y + 28;
  for (const item of highlights) {
    const wrapped = splitTextIntoLines(ctx, `✓ ${item}`, maxWidth);
    for (const line of wrapped) {
      ctx.fillText(line, canvasW / 2, cursorY);
      cursorY += 34;
    }
    cursorY += 6;
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

  let cursorY = middleEndY + 12;
  if (countdown) {
    cursorY =
      drawCountdownBanner(ctx, countdown.message, cursorY, theme, layout, canvasW) + 12;
  }

  if (highlights.length > 0) {
    cursorY = drawEventHighlights(ctx, highlights, cursorY, layout, canvasW) + 8;
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

  drawBmmHeader(ctx, event, logo, theme, layout, POSTER_W, POSTER_H, hashtag);

  const photoX = layoutX(layout, PERSONAL_PHOTO_POSITION.x, POSTER_W);
  const photoY = layoutY(layout, PERSONAL_PHOTO_POSITION.y, POSTER_H);
  const photoRadius = layoutScale(layout, PERSONAL_PHOTO_POSITION.radius, POSTER_W);
  const ringPadding = layoutScale(layout, PERSONAL_PHOTO_POSITION.ringPadding, POSTER_W);
  drawCircularImage(ctx, photo, photoX, photoY, photoRadius, input.photoCrop);
  ctx.strokeStyle = accent;
  ctx.lineWidth = theme.photoRingWidth;
  ctx.beginPath();
  ctx.arc(photoX, photoY, photoRadius + ringPadding, 0, Math.PI * 2);
  ctx.stroke();

  const infoX = layoutX(layout, 500, POSTER_W);
  let infoY = layoutY(layout, 220, POSTER_H);
  if (headline.length > 0) {
    infoY = drawHeadlineBlock(
      ctx,
      headline,
      infoX,
      layoutY(layout, 200, POSTER_H),
      theme
    );
    infoY = Math.max(infoY + 12, layoutY(layout, 400, POSTER_H));
  }

  const displayName = `${input.firstName} ${input.lastName}`.trim();
  const cityLabel = (input.city?.trim() || event.location || "").trim();
  drawAttendeeBlock(ctx, displayName, input.role, cityLabel, infoX, infoY, theme);

  const middleY = layoutY(layout, 560, POSTER_H);
  const qrUrl = getQrUrl(event, config.qrUrl);
  const qr = qrUrl ? await loadQrCode(qrUrl) : null;
  const middleTagline = genderTagline.trim() || event.tagline;
  drawMiddleSection(ctx, middleTagline, qr, middleY, layout, POSTER_W);

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

  drawBmmHeader(ctx, event, logo, theme, layout, POSTER_W, POSTER_H, hashtag);

  if (headline.length > 0) {
    drawHeadlineBlockCentered(
      ctx,
      headline,
      POSTER_W / 2,
      layoutY(layout, 150, POSTER_H),
      layout.innerW - 80,
      theme
    );
  }

  const positions = getGroupPhotoPositions(input.memberCount).map((pos) => ({
    x: layoutX(layout, pos.x, POSTER_W),
    y: layoutY(layout, pos.y, POSTER_H),
    r: layoutScale(layout, pos.r, POSTER_W),
  }));
  const maxRadius = Math.max(...positions.map((pos) => pos.r));
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

  const photoBottom = positions[0].y + maxRadius + theme.photoRingWidth + 16;
  const nameY = photoBottom + 44;

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = POSTER_TEXT;
  ctx.font = posterFont(700, 38);
  const groupName = input.groupName.trim() || "Our Group";
  ctx.fillText(groupName.toUpperCase(), POSTER_W / 2, nameY);

  const groupCity = (input.city?.trim() || event.location || "").trim();
  let middleY = nameY + 36;
  if (groupCity) {
    ctx.font = posterFont(600, 26);
    ctx.fillText(groupCity.toUpperCase(), POSTER_W / 2, nameY + 34);
    middleY = nameY + 68;
  }

  const qrUrl = getQrUrl(event, config.qrUrl);
  const qr = qrUrl ? await loadQrCode(qrUrl) : null;
  const middleTagline = groupTagline.trim() || event.tagline;
  drawMiddleSection(ctx, middleTagline, qr, middleY, layout, POSTER_W);

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

function drawPersonalDp(
  ctx: CanvasRenderingContext2D,
  input: PersonalDpRenderInput,
  logo: HTMLImageElement,
  photo: HTMLImageElement,
  theme: ResolvedFrameTheme,
  layout: PosterLayoutContext,
  framePainted = false
) {
  const { accent } = theme.colors;
  const { x, y, radius, ringPadding } = PERSONAL_DP_PHOTO_POSITION;
  const photoX = layoutX(layout, x, DP_W);
  const photoY = layoutY(layout, y, DP_H);
  const photoRadius = layoutScale(layout, radius, DP_W);
  const photoRingPadding = layoutScale(layout, ringPadding, DP_W);

  if (!framePainted) {
    ctx.fillStyle = resolveFrameBackground(theme);
    ctx.fillRect(0, 0, DP_W, DP_H);
  }

  drawLogo(ctx, logo, layoutX(layout, 320, DP_W), layoutY(layout, 28, DP_H), 72, 72);
  drawCircularImage(ctx, photo, photoX, photoY, photoRadius, input.photoCrop);

  ctx.strokeStyle = accent;
  ctx.lineWidth = theme.photoRingWidth;
  ctx.beginPath();
  ctx.arc(photoX, photoY, photoRadius + photoRingPadding, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = posterFont("bold", 15);
  ctx.textAlign = "center";
  ctx.direction = "ltr";
  const ringText = `I am Attending ${input.event.name}`;
  wrapCanvasText(
    ctx,
    ringText,
    DP_W / 2,
    layoutY(layout, 490, DP_H),
    layout.innerW - 40,
    18
  );
}

function drawGroupDp(
  ctx: CanvasRenderingContext2D,
  input: GroupDpRenderInput,
  logo: HTMLImageElement,
  photos: HTMLImageElement[],
  theme: ResolvedFrameTheme,
  layout: PosterLayoutContext,
  framePainted = false
) {
  const { accent } = theme.colors;

  if (!framePainted) {
    ctx.fillStyle = resolveFrameBackground(theme);
    ctx.fillRect(0, 0, DP_W, DP_H);
  }

  drawLogo(ctx, logo, layoutX(layout, 320, DP_W), layoutY(layout, 28, DP_H), 68, 68);

  const dpPositions = getGroupDpPositions(input.memberCount).map((pos) => ({
    x: layoutX(layout, pos.x, DP_W),
    y: layoutY(layout, pos.y, DP_H),
    r: layoutScale(layout, pos.r, DP_W),
  }));
  photos.forEach((photo, i) => {
    const pos = dpPositions[i];
    const crop = input.photoCrops[i];
    drawCircularImage(ctx, photo, pos.x, pos.y, pos.r, crop);
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(4, theme.photoRingWidth - 2);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, pos.r + 3, 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.fillStyle = "#ffffff";
  ctx.font = posterFont("bold", 16);
  ctx.textAlign = "center";
  ctx.direction = "ltr";
  const groupName = input.groupName.trim() || "Our Group";
  wrapCanvasText(
    ctx,
    groupName,
    DP_W / 2,
    layoutY(layout, 530, DP_H),
    layout.innerW - 40,
    18
  );
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
  drawPersonalDp(ctx, input, logo, photo, theme, layout, true);
  await paintFrameOverlay(ctx, theme, DP_W, DP_H);
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
  drawGroupDp(ctx, input, logo, photos, theme, layout, true);
  await paintFrameOverlay(ctx, theme, DP_W, DP_H);
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
