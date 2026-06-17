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

type PersonalInput = PersonalFormData & { event: EventWithOptions };
type GroupInput = GroupFormData & { event: EventWithOptions };

const POSTER_W = 1080;
const POSTER_H = 1080;

export type PersonalPosterRenderInput = Omit<PersonalFormData, "photo"> & {
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

function fillCenteredLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  centerX: number,
  y: number
) {
  ctx.direction = "ltr";
  ctx.textAlign = "left";
  const width = ctx.measureText(line).width;
  ctx.fillText(line, centerX - width / 2, y);
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  ctx.textBaseline = "alphabetic";
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      fillCenteredLine(ctx, line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) fillCenteredLine(ctx, line, x, currentY);
  return currentY + lineHeight;
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
  ctx.fillStyle = primary;
  ctx.font = "bold 40px system-ui, sans-serif";
  ctx.fillText(event.name.toUpperCase(), POSTER_W / 2, 72);

  ctx.fillStyle = accent;
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.fillText(getPosterVenueLine(event), POSTER_W / 2, 108);

  if (hashtag) {
    ctx.textAlign = "right";
    ctx.fillStyle = resolvePosterColor("green", primary, accent, theme.colors.gold, green);
    ctx.font = "bold 26px system-ui, sans-serif";
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
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  let currentY = y;
  for (const line of lines) {
    ctx.fillStyle = resolvePosterColor(line.color, primary, accent, gold, green);
    ctx.font = "bold 34px system-ui, sans-serif";
    ctx.fillText(line.text, x, currentY);
    currentY += 42;
  }
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
  ctx.font = "bold 36px system-ui, sans-serif";
  const upperName = name.toUpperCase();
  ctx.fillText(upperName, x, y);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y + 10);
  ctx.lineTo(x + Math.min(ctx.measureText(upperName).width, 420), y + 10);
  ctx.stroke();

  ctx.fillStyle = primary;
  ctx.font = "600 22px system-ui, sans-serif";
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
  ctx.font = "600 28px system-ui, sans-serif";
  wrapCanvasText(ctx, slogan, POSTER_W / 2, textY, 720, 36);

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
    ctx.fillStyle = resolvePosterColor(stat.color, primary, accent, gold, green);
    ctx.fillRect(x, y, blockW, barH);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px system-ui, sans-serif";
    ctx.fillText(stat.value, x + blockW / 2, y + 52);

    ctx.font = "500 18px system-ui, sans-serif";
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
  ctx.fillStyle = primary;
  ctx.fillRect(0, y, POSTER_W, height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "500 22px system-ui, sans-serif";
  ctx.textBaseline = "middle";
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

  ctx.fillStyle = theme.colors.accent;
  ctx.fillRect(barX, y, barW, COUNTDOWN_BAR_H);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let fontSize = 22;
  ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
  while (ctx.measureText(message).width > barW - 24 && fontSize > 14) {
    fontSize -= 1;
    ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
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
  drawMiddleSection(ctx, event.tagline, qr, middleY, primary);

  drawPosterFooterSection(ctx, event, theme, middleY + 118);
}

export async function renderPersonalPosterCanvas(
  canvas: HTMLCanvasElement,
  input: PersonalPosterRenderInput,
  photo: HTMLImageElement
): Promise<void> {
  const theme = resolveFrameTheme(input.event, input.frameThemeKey);
  const logo = await loadEventLogo(input.event);

  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  await drawBmmPersonalPoster(ctx, input, logo, photo, theme);
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
  dCtx.font = "bold 15px system-ui, sans-serif";
  dCtx.textAlign = "center";
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
  const photoDataUrls = await Promise.all(input.photos.map(fileToDataUrl));
  const photos = await Promise.all(photoDataUrls.map(loadImage));
  const logo = await loadEventLogo(input.event);
  const { event } = input;
  const { primary, accent, background } = theme.colors;
  const config = parsePosterTemplate(event);
  const hashtag = getPosterHashtag(config, event);

  const poster = document.createElement("canvas");
  poster.width = POSTER_W;
  poster.height = POSTER_H;
  const pCtx = poster.getContext("2d")!;

  pCtx.fillStyle = background || "#ffffff";
  pCtx.fillRect(0, 0, POSTER_W, POSTER_H);
  drawFrameThemeDecoration(pCtx, theme, POSTER_W, POSTER_H);

  drawBmmHeader(pCtx, event, logo, theme, hashtag);

  const positions = getGroupPhotoPositions(input.memberCount);
  photos.forEach((photo, i) => {
    const pos = positions[i];
    const crop = input.photoCrops[i];
    drawCircularImage(pCtx, photo, pos.x, pos.y, pos.r, crop);
    pCtx.strokeStyle = accent;
    pCtx.lineWidth = theme.photoRingWidth;
    pCtx.beginPath();
    pCtx.arc(pos.x, pos.y, pos.r + 5, 0, Math.PI * 2);
    pCtx.stroke();
  });

  pCtx.textAlign = "center";
  pCtx.fillStyle = accent;
  pCtx.font = "bold 34px system-ui, sans-serif";
  pCtx.fillText(input.groupName.toUpperCase(), POSTER_W / 2, 500);

  const groupCity = (input.city?.trim() || event.location || "").toUpperCase();
  if (groupCity) {
    pCtx.fillStyle = primary;
    pCtx.font = "600 22px system-ui, sans-serif";
    pCtx.fillText(groupCity, POSTER_W / 2, 538);
  }

  const middleY = 560;
  const tagline = getGenderTagline(event, "group");
  const qrUrl = getQrUrl(event, config.qrUrl);
  const qr = qrUrl ? await loadQrCode(qrUrl) : null;
  drawMiddleSection(pCtx, tagline || event.tagline, qr, middleY, primary);

  drawPosterFooterSection(pCtx, event, theme, middleY + 118);

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
  dCtx.font = "bold 16px system-ui, sans-serif";
  dCtx.textAlign = "center";
  wrapCanvasText(dCtx, input.groupName, 320, 530, 560, 18);

  return {
    posterDataUrl: poster.toDataURL("image/png"),
    dpDataUrl: dp.toDataURL("image/png"),
  };
}

function getGroupPhotoPositions(count: number) {
  if (count === 2) {
    return [
      { x: 360, y: 360, r: 100 },
      { x: 720, y: 360, r: 100 },
    ];
  }
  if (count === 3) {
    return [
      { x: 540, y: 300, r: 88 },
      { x: 360, y: 430, r: 88 },
      { x: 720, y: 430, r: 88 },
    ];
  }
  return [
    { x: 360, y: 310, r: 78 },
    { x: 720, y: 310, r: 78 },
    { x: 360, y: 440, r: 78 },
    { x: 720, y: 440, r: 78 },
  ];
}

function getGroupDpPositions(count: number) {
  if (count === 2) {
    return [
      { x: 220, y: 270, r: 95 },
      { x: 420, y: 270, r: 95 },
    ];
  }
  if (count === 3) {
    return [
      { x: 320, y: 220, r: 80 },
      { x: 200, y: 370, r: 80 },
      { x: 440, y: 370, r: 80 },
    ];
  }
  return [
    { x: 200, y: 240, r: 70 },
    { x: 440, y: 240, r: 70 },
    { x: 200, y: 390, r: 70 },
    { x: 440, y: 390, r: 70 },
  ];
}
