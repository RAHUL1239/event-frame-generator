import type { EventWithOptions, GeneratedAssets, GroupFormData, PersonalFormData } from "./types";
import {
  drawCircularImage,
  drawLogo,
  fileToDataUrl,
  loadEventLogo,
  loadImage,
} from "./utils";

type PersonalInput = PersonalFormData & { event: EventWithOptions };
type GroupInput = GroupFormData & { event: EventWithOptions };

function getGenderTagline(event: EventWithOptions, genderKey: string) {
  return event.genderOptions.find((o) => o.key === genderKey)?.tagline ?? "";
}

function drawPosterHeader(
  ctx: CanvasRenderingContext2D,
  event: EventWithOptions,
  logo: HTMLImageElement,
  centerX: number
): number {
  const logoH = drawLogo(ctx, logo, centerX, 12, 110, 110);
  const y = 12 + logoH + 64;

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "34px system-ui, sans-serif";
  ctx.fillText(event.dateLabel, centerX, y);

  return y + 40;
}

function drawEventNameBelow(
  ctx: CanvasRenderingContext2D,
  event: EventWithOptions,
  centerX: number,
  y: number
): number {
  ctx.textAlign = "center";
  ctx.fillStyle = event.accentColor;
  ctx.font = "bold 28px system-ui, sans-serif";
  return wrapCanvasText(ctx, event.name.toUpperCase(), centerX, y, 880, 34);
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

function drawCenteredTagline(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  lineHeight: number,
  color: string
): number {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px system-ui, sans-serif`;
  return wrapCanvasText(ctx, text, centerX, y, maxWidth, lineHeight);
}

export async function generatePersonalAssets(
  input: PersonalInput
): Promise<GeneratedAssets> {
  const photoDataUrl = await fileToDataUrl(input.photo);
  const photo = await loadImage(photoDataUrl);
  const logo = await loadEventLogo(input.event);
  const tagline = getGenderTagline(input.event, input.genderKey);

  const poster = document.createElement("canvas");
  poster.width = 1080;
  poster.height = 1080;
  const pCtx = poster.getContext("2d")!;

  const gradient = pCtx.createLinearGradient(0, 0, 0, poster.height);
  gradient.addColorStop(0, input.event.primaryColor);
  gradient.addColorStop(1, "#0f3331");
  pCtx.fillStyle = gradient;
  pCtx.fillRect(0, 0, poster.width, poster.height);

  const headerBottom = drawPosterHeader(pCtx, input.event, logo, 540);

  const photoRadius = 158;
  const ringRadius = photoRadius + 8;
  const ringWidth = 6;
  const photoY = headerBottom + photoRadius + 28;
  const ringBottom = photoY + ringRadius + ringWidth / 2;

  drawCircularImage(pCtx, photo, 540, photoY, photoRadius, input.photoCrop);

  pCtx.strokeStyle = input.event.accentColor;
  pCtx.lineWidth = ringWidth;
  pCtx.beginPath();
  pCtx.arc(540, photoY, ringRadius, 0, Math.PI * 2);
  pCtx.stroke();

  let textY = drawEventNameBelow(pCtx, input.event, 540, ringBottom + 48);
  textY += 20;

  pCtx.fillStyle = "#ffffff";
  pCtx.font = "bold 38px system-ui, sans-serif";
  pCtx.textAlign = "center";
  const displayName = `${input.firstName} ${input.lastName}`.trim();
  pCtx.fillText(displayName.toUpperCase(), 540, textY);
  textY += 46;

  pCtx.font = "24px system-ui, sans-serif";
  pCtx.fillStyle = "#e8e8e8";
  if (input.role) {
    pCtx.fillText(input.role.toUpperCase(), 540, textY);
    textY += 36;
  }
  const cityLabel = (input.city?.trim() || input.event.location || "").toUpperCase();
  if (cityLabel) {
    pCtx.fillStyle = "#9ca3af";
    pCtx.fillText(cityLabel, 540, textY);
    textY += 36;
  }

  drawCenteredTagline(pCtx, tagline, 540, textY + 16, 900, 32, 40, input.event.accentColor);

  const dp = document.createElement("canvas");
  dp.width = 640;
  dp.height = 640;
  const dCtx = dp.getContext("2d")!;

  dCtx.fillStyle = input.event.primaryColor;
  dCtx.fillRect(0, 0, dp.width, dp.height);

  drawLogo(dCtx, logo, 320, 10, 72, 72);

  drawCircularImage(dCtx, photo, 320, 300, 155, input.photoCrop);

  dCtx.strokeStyle = input.event.accentColor;
  dCtx.lineWidth = 6;
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
  const photoDataUrls = await Promise.all(input.photos.map(fileToDataUrl));
  const photos = await Promise.all(photoDataUrls.map(loadImage));
  const logo = await loadEventLogo(input.event);

  const poster = document.createElement("canvas");
  poster.width = 1080;
  poster.height = 1080;
  const pCtx = poster.getContext("2d")!;

  const gradient = pCtx.createLinearGradient(0, 0, 0, poster.height);
  gradient.addColorStop(0, input.event.primaryColor);
  gradient.addColorStop(1, "#0f3331");
  pCtx.fillStyle = gradient;
  pCtx.fillRect(0, 0, poster.width, poster.height);

  const headerBottom = drawPosterHeader(pCtx, input.event, logo, 540);

  const positions = getGroupPhotoPositions(input.memberCount, headerBottom);
  photos.forEach((photo, i) => {
    const pos = positions[i];
    const crop = input.photoCrops[i];
    drawCircularImage(pCtx, photo, pos.x, pos.y, pos.r, crop);
    pCtx.strokeStyle = input.event.accentColor;
    pCtx.lineWidth = 5;
    pCtx.beginPath();
    pCtx.arc(pos.x, pos.y, pos.r + 4, 0, Math.PI * 2);
    pCtx.stroke();
  });

  const photoBottom = Math.max(...positions.map((p) => p.y + p.r + 8));
  let textY = drawEventNameBelow(pCtx, input.event, 540, photoBottom + 52);
  textY += 16;

  pCtx.fillStyle = "#ffffff";
  pCtx.font = "bold 34px system-ui, sans-serif";
  pCtx.textAlign = "center";
  pCtx.fillText(input.groupName.toUpperCase(), 540, textY);
  textY += 42;

  const groupCity = (input.city?.trim() || input.event.location || "").toUpperCase();
  if (groupCity) {
    pCtx.font = "22px system-ui, sans-serif";
    pCtx.fillStyle = "#9ca3af";
    pCtx.fillText(groupCity, 540, textY);
    textY += 36;
  }

  drawCenteredTagline(
    pCtx,
    getGenderTagline(input.event, "group"),
    540,
    textY + 12,
    900,
    30,
    38,
    input.event.accentColor
  );

  const dp = document.createElement("canvas");
  dp.width = 640;
  dp.height = 640;
  const dCtx = dp.getContext("2d")!;
  dCtx.fillStyle = input.event.primaryColor;
  dCtx.fillRect(0, 0, dp.width, dp.height);

  drawLogo(dCtx, logo, 320, 10, 68, 68);

  const dpPositions = getGroupDpPositions(input.memberCount);
  photos.forEach((photo, i) => {
    const pos = dpPositions[i];
    const crop = input.photoCrops[i];
    drawCircularImage(dCtx, photo, pos.x, pos.y + 20, pos.r, crop);
    dCtx.strokeStyle = input.event.accentColor;
    dCtx.lineWidth = 4;
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

function getGroupPhotoPositions(count: number, headerBottom: number) {
  const baseY = headerBottom + 150;
  if (count === 2) {
    return [
      { x: 360, y: baseY, r: 120 },
      { x: 720, y: baseY, r: 120 },
    ];
  }
  if (count === 3) {
    return [
      { x: 540, y: baseY - 40, r: 100 },
      { x: 360, y: baseY + 100, r: 100 },
      { x: 720, y: baseY + 100, r: 100 },
    ];
  }
  return [
    { x: 360, y: baseY - 30, r: 90 },
    { x: 720, y: baseY - 30, r: 90 },
    { x: 360, y: baseY + 110, r: 90 },
    { x: 720, y: baseY + 110, r: 90 },
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
