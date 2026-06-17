import type { EventWithOptions, GeneratedAssets, GroupFormData, PersonalFormData } from "./types";
import {
  drawFrameThemeDecoration,
  resolveFrameTheme,
  type ResolvedFrameTheme,
} from "./frame-themes";
import { getEventCountdown } from "./countdown";
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

function drawBmmHeader(
  ctx: CanvasRenderingContext2D,
  event: EventWithOptions,
  logo: HTMLImageElement,
  theme: ResolvedFrameTheme,
  hashtag?: string
) {
  const { primary, accent, green } = theme.colors;
  drawLogoAt(ctx, logo, 36, 28, 96, 96);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = primary;
  ctx.font = posterFont(700, 40);
  ctx.fillText(event.name.toUpperCase(), POSTER_W / 2, 72);

  ctx.fillStyle = accent;
  ctx.font = posterFont(600, 22);
  ctx.fillText(getPosterVenueLine(event), POSTER_W / 2, 108);

  if (hashtag) {
    ctx.textAlign = "right";
    ctx.fillStyle = resolvePosterColor("green", primary, accent, theme.colors.gold, green);
    ctx.font = posterFont(700, 26);
    ctx.fillText(hashtag, POSTER_W - 36, 58);
  }
}

function drawHeadlineBlock(
  ctx: CanvasRenderingContext2D,
  lines: { text: string; color?: string }[],
  x: number,
  y: number,
  theme: ResolvedFrameTheme
) {
  const { primary, accent, gold, green } = theme.colors;
  const maxWidth = POSTER_W - x - 36;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  let currentY = y;
  for (const line of lines) {
    ctx.fillStyle = resolvePosterColor(line.color, primary, accent, gold, green);
    ctx.font = posterFont(700, 34);
    const wrapped = splitTextIntoLines(ctx, line.text, maxWidth);
    for (const segment of wrapped) {
      ctx.fillText(segment, x, currentY);
      currentY += 42;
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
  theme: ResolvedFrameTheme
) {
  const { primary, accent, gold, green } = theme.colors;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  let currentY = startY;
  for (const line of lines) {
    ctx.fillStyle = resolvePosterColor(line.color, primary, accent, gold, green);
    ctx.font = posterFont(700, 34);
    const wrapped = splitTextIntoLines(ctx, line.text, maxWidth);
    for (const segment of wrapped) {
      ctx.fillText(segment, centerX, currentY);
      currentY += 40;
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
  const { primary, accent } = theme.colors;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";
  ctx.fillStyle = primary;
  ctx.font = posterFont(700, 36);
  const upperName = name.toUpperCase();
  ctx.fillText(upperName, x, y);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y + 10);
  ctx.lineTo(x + Math.min(ctx.measureText(upperName).width, 420), y + 10);
  ctx.stroke();

  ctx.fillStyle = primary;
  ctx.font = posterFont(600, 22);
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
  primary: string
) {
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, y);
  ctx.lineTo(POSTER_W - 36, y);
  ctx.stroke();

  const textY = y + 58;
  ctx.fillStyle = primary;
  ctx.font = posterFont(600, 30);
  const textMaxWidth = qr ? POSTER_W - 220 : 860;
  wrapCanvasText(ctx, slogan, POSTER_W / 2, textY, textMaxWidth, 38);

  if (qr) {
    const size = 96;
    const qrX = POSTER_W - 36 - size;
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
    const color = resolvePosterColor(stat.color, primary, accent, gold, green);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 10, y + 8, blockW - 20, barH - 16);

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.direction = "ltr";
    ctx.fillStyle = color;
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
  primary: string,
  website?: string,
  socialHandle?: string
) {
  ctx.strokeStyle = primary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(36, y);
  ctx.lineTo(POSTER_W - 36, y);
  ctx.stroke();

  ctx.fillStyle = primary;
  ctx.font = posterFont(500, 22);
  ctx.textBaseline = "middle";
  ctx.direction = "ltr";
  if (website) {
    ctx.textAlign = "left";
    ctx.fillText(`🌐 ${website}`, 40, y + height / 2);
  }

  if (socialHandle) {
    ctx.textAlign = "right";
    ctx.fillText(`in  ig  fb  yt  ${socialHandle}`, POSTER_W - 40, y + height / 2);
  }
}

const COUNTDOWN_BAR_H = 48;

function drawCountdownBanner(
  ctx: CanvasRenderingContext2D,
  message: string,
  y: number,
  theme: ResolvedFrameTheme
): number {
  const barX = 36;
  const barW = POSTER_W - 72;

  ctx.strokeStyle = theme.colors.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, y, barW, COUNTDOWN_BAR_H);

  ctx.fillStyle = theme.colors.primary;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "ltr";
  let fontSize = 22;
  ctx.font = posterFont(700, fontSize);
  while (ctx.measureText(message).width > barW - 24 && fontSize > 14) {
    fontSize -= 1;
    ctx.font = posterFont(700, fontSize);
  }
  ctx.fillText(message, POSTER_W / 2, y + COUNTDOWN_BAR_H / 2);

  return y + COUNTDOWN_BAR_H;
}

function drawPosterFooterSection(
  ctx: CanvasRenderingContext2D,
  event: EventWithOptions,
  theme: ResolvedFrameTheme,
  middleEndY: number
) {
  const config = parsePosterTemplate(event);
  const stats = config.stats ?? [];
  const countdown = getEventCountdown(event);

  let cursorY = middleEndY + 12;
  if (countdown) {
    cursorY = drawCountdownBanner(ctx, countdown.message, cursorY, theme) + 12;
  }

  const statsY = stats.length > 0 ? cursorY : cursorY;
  const footerY = stats.length > 0 ? statsY + 118 : statsY + 8;
  const footerH = POSTER_H - footerY;

  if (stats.length > 0) {
    drawStatsBar(ctx, stats, statsY, theme);
  }

  drawFooter(
    ctx,
    footerY,
    footerH,
    theme.colors.primary,
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
  const { primary, accent, background } = theme.colors;
  const config = parsePosterTemplate(event);
  const genderTagline = getGenderTagline(event, input.genderKey);
  const hashtag = getPosterHashtag(config, event);
  const headline = getPosterHeadline(config, event, genderTagline);

  ctx.fillStyle = background || "#ffffff";
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);
  drawFrameThemeDecoration(ctx, theme, POSTER_W, POSTER_H);

  drawBmmHeader(ctx, event, logo, theme, hashtag);

  const photoX = 250;
  const photoY = 390;
  const photoRadius = 128;
  drawCircularImage(ctx, photo, photoX, photoY, photoRadius, input.photoCrop);
  ctx.strokeStyle = accent;
  ctx.lineWidth = theme.photoRingWidth;
  ctx.beginPath();
  ctx.arc(photoX, photoY, photoRadius + 6, 0, Math.PI * 2);
  ctx.stroke();

  drawHeadlineBlock(ctx, headline, 500, 200, theme);

  const displayName = `${input.firstName} ${input.lastName}`.trim();
  const cityLabel = (input.city?.trim() || event.location || "").trim();
  drawAttendeeBlock(ctx, displayName, input.role, cityLabel, 500, 400, theme);

  const middleY = 560;
  const qrUrl = getQrUrl(event, config.qrUrl);
  const qr = qrUrl ? await loadQrCode(qrUrl) : null;
  const middleTagline = genderTagline.trim() || event.tagline;
  drawMiddleSection(ctx, middleTagline, qr, middleY, accent);

  drawPosterFooterSection(ctx, event, theme, middleY + 118);
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
  const { primary, accent, background } = theme.colors;
  const config = parsePosterTemplate(event);
  const hashtag = getPosterHashtag(config, event);
  const groupTagline = getGenderTagline(event, "group");
  const headline = getPosterHeadline(config, event, groupTagline);

  ctx.fillStyle = background || "#ffffff";
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);
  drawFrameThemeDecoration(ctx, theme, POSTER_W, POSTER_H);

  drawBmmHeader(ctx, event, logo, theme, hashtag);

  drawHeadlineBlockCentered(ctx, headline, POSTER_W / 2, 150, 920, theme);

  const positions = getGroupPhotoPositions(input.memberCount);
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
  ctx.fillStyle = accent;
  ctx.font = posterFont(700, 34);
  const groupName = input.groupName.trim() || "Our Group";
  ctx.fillText(groupName.toUpperCase(), POSTER_W / 2, nameY);

  const groupCity = (input.city?.trim() || event.location || "").trim();
  let middleY = nameY + 36;
  if (groupCity) {
    ctx.fillStyle = primary;
    ctx.font = posterFont(600, 22);
    ctx.fillText(groupCity.toUpperCase(), POSTER_W / 2, nameY + 34);
    middleY = nameY + 68;
  }

  const qrUrl = getQrUrl(event, config.qrUrl);
  const qr = qrUrl ? await loadQrCode(qrUrl) : null;
  const middleTagline = groupTagline.trim() || event.tagline;
  drawMiddleSection(ctx, middleTagline, qr, middleY, accent);

  drawPosterFooterSection(ctx, event, theme, middleY + 118);
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

export async function generatePersonalAssets(
  input: PersonalInput
): Promise<GeneratedAssets> {
  const theme = resolveFrameTheme(input.event, input.frameThemeKey);
  const photoDataUrl = await fileToDataUrl(input.photo);
  const photo = await loadImage(photoDataUrl);
  const logo = await loadEventLogo(input.event);

  const poster = document.createElement("canvas");
  await renderPersonalPosterCanvas(poster, input, photo);

  const dp = document.createElement("canvas");
  dp.width = 640;
  dp.height = 640;
  const dCtx = dp.getContext("2d")!;

  dCtx.fillStyle = theme.colors.primary;
  dCtx.fillRect(0, 0, dp.width, dp.height);
  drawFrameThemeDecoration(dCtx, theme, dp.width, dp.height);

  drawLogo(dCtx, logo, 320, 10, 72, 72);

  drawCircularImage(dCtx, photo, 320, 300, 155, input.photoCrop);

  dCtx.strokeStyle = theme.colors.accent;
  dCtx.lineWidth = theme.photoRingWidth;
  dCtx.beginPath();
  dCtx.arc(320, 300, 163, 0, Math.PI * 2);
  dCtx.stroke();

  dCtx.fillStyle = "#ffffff";
  dCtx.font = posterFont("bold", 15);
  dCtx.textAlign = "center";
  dCtx.direction = "ltr";
  const ringText = `I am Attending ${input.event.name}`;
  wrapCanvasText(dCtx, ringText, 320, 490, 520, 18);

  return {
    posterDataUrl: poster.toDataURL("image/png"),
    dpDataUrl: dp.toDataURL("image/png"),
  };
}

export async function generateGroupAssets(
  input: GroupInput
): Promise<GeneratedAssets> {
  const theme = resolveFrameTheme(input.event, input.frameThemeKey);
  const { accent } = theme.colors;
  const photoDataUrls = await Promise.all(input.photos.map(fileToDataUrl));
  const photos = await Promise.all(photoDataUrls.map(loadImage));
  const logo = await loadEventLogo(input.event);

  const poster = document.createElement("canvas");
  await renderGroupPosterCanvas(poster, input, photos);

  const dp = document.createElement("canvas");
  dp.width = 640;
  dp.height = 640;
  const dCtx = dp.getContext("2d")!;
  dCtx.fillStyle = theme.colors.primary;
  dCtx.fillRect(0, 0, dp.width, dp.height);
  drawFrameThemeDecoration(dCtx, theme, dp.width, dp.height);

  drawLogo(dCtx, logo, 320, 10, 68, 68);

  const dpPositions = getGroupDpPositions(input.memberCount);
  photos.forEach((photo, i) => {
    const pos = dpPositions[i];
    const crop = input.photoCrops[i];
    drawCircularImage(dCtx, photo, pos.x, pos.y + 20, pos.r, crop);
    dCtx.strokeStyle = accent;
    dCtx.lineWidth = Math.max(4, theme.photoRingWidth - 2);
    dCtx.beginPath();
    dCtx.arc(pos.x, pos.y + 20, pos.r + 3, 0, Math.PI * 2);
    dCtx.stroke();
  });

  dCtx.fillStyle = "#ffffff";
  dCtx.font = posterFont("bold", 16);
  dCtx.textAlign = "center";
  dCtx.direction = "ltr";
  wrapCanvasText(dCtx, input.groupName, 320, 530, 560, 18);

  return {
    posterDataUrl: poster.toDataURL("image/png"),
    dpDataUrl: dp.toDataURL("image/png"),
  };
}

export function getGroupPosterPhotoPositions(count: 2 | 3 | 4) {
  return getGroupPhotoPositions(count);
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
  const centerY = 300;

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
