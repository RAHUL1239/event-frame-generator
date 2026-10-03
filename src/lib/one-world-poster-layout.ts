import type { EventWithOptions } from "./types";
import type { ResolvedFrameTheme } from "./frame-themes";
import type { PhotoCrop } from "./photo-crop";
import { parseEventHighlights } from "./event-highlights";
import { drawCircularImage } from "./utils";
import { posterFont } from "./poster-fonts";
import {
  fillTextWithSpaces,
  measureGlyphWidth,
  measureLineWidth,
} from "./canvas-text";
import { ONE_WORLD_COLORS } from "./frames/one-world";

const DEFAULT_SHOUT = "CELEBRATE WITH US!";
const DEFAULT_SUBTITLE = "PROFILE FRAME & POSTER GENERATOR";
const BRAND_URL = "RSVPShare.com";
const BRAND_TAGLINE = "Create yours. Share the excitement.";

const TITLE_LETTER_COLORS = [
  ONE_WORLD_COLORS.orange,
  ONE_WORLD_COLORS.teal,
  ONE_WORLD_COLORS.magenta,
  ONE_WORLD_COLORS.navy,
] as const;

const DEFAULT_ACTIONS = [
  {
    title: "CONNECT",
    subtitle: "Meet new people",
    color: ONE_WORLD_COLORS.orange,
    icon: "people" as const,
  },
  {
    title: "CELEBRATE",
    subtitle: "Music • Food • Culture",
    color: ONE_WORLD_COLORS.teal,
    icon: "sparkle" as const,
  },
  {
    title: "BE PART OF IT",
    subtitle: "A stronger, kinder community",
    color: ONE_WORLD_COLORS.magenta,
    icon: "heart" as const,
  },
];

export function isOneWorldLayout(theme: ResolvedFrameTheme): boolean {
  return theme.paint.layout === "one-world";
}

function owFont(
  theme: ResolvedFrameTheme,
  weight: 400 | 600 | 700 | 800,
  sizePx: number
) {
  return posterFont(weight === 800 ? 700 : weight, sizePx, theme.paint.type.fontFamily);
}

function extraBold(theme: ResolvedFrameTheme, sizePx: number) {
  return `800 ${sizePx}px ${theme.paint.type.fontFamily}`;
}

type ActionBlock = (typeof DEFAULT_ACTIONS)[number];

function resolveShout(event: EventWithOptions): string {
  const subtitle = event.subtitle?.trim();
  if (
    subtitle &&
    subtitle.toUpperCase() !== DEFAULT_SUBTITLE &&
    !subtitle.startsWith("#")
  ) {
    return subtitle.toUpperCase();
  }
  return DEFAULT_SHOUT;
}

function resolveActions(event: EventWithOptions): ActionBlock[] {
  const highlights = parseEventHighlights(event.eventHighlights);
  return DEFAULT_ACTIONS.map((defaults, index) => {
    const raw = highlights[index];
    if (!raw) return defaults;
    const parts = raw
      .split("\n")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return {
        ...defaults,
        title: parts[0].toUpperCase(),
        subtitle: parts.slice(1).join(" "),
      };
    }
    return { ...defaults, subtitle: parts[0] ?? defaults.subtitle };
  });
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

function paintCreamField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#FFF9F3");
  gradient.addColorStop(0.45, ONE_WORLD_COLORS.cream);
  gradient.addColorStop(1, "#FFF1E6");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

type ConfettiSpec = {
  x: number;
  y: number;
  kind: "rect" | "dot" | "leaf";
  color: string;
  size: number;
  rot: number;
};

function confettiPieces(width: number, height: number): ConfettiSpec[] {
  const colors = [
    ONE_WORLD_COLORS.orange,
    ONE_WORLD_COLORS.teal,
    ONE_WORLD_COLORS.magenta,
    ONE_WORLD_COLORS.navy,
    ONE_WORLD_COLORS.gold,
    "#7C3AED",
    "#22C55E",
  ];
  const spots: Array<[number, number, ConfettiSpec["kind"], number]> = [
    [0.06, 0.18, "rect", 0.4],
    [0.12, 0.28, "dot", 1.1],
    [0.04, 0.42, "leaf", -0.6],
    [0.1, 0.55, "rect", 0.8],
    [0.07, 0.68, "dot", 0.2],
    [0.88, 0.16, "rect", -0.5],
    [0.94, 0.26, "dot", 0.9],
    [0.9, 0.38, "leaf", 0.4],
    [0.96, 0.5, "rect", 1.2],
    [0.86, 0.58, "dot", -0.3],
    [0.22, 0.12, "dot", 0.5],
    [0.78, 0.1, "rect", 0.7],
    [0.48, 0.08, "leaf", -0.2],
    [0.62, 0.2, "dot", 1.4],
    [0.34, 0.22, "rect", -0.9],
    [0.18, 0.78, "leaf", 0.3],
    [0.82, 0.72, "rect", -0.7],
  ];
  return spots.map(([nx, ny, kind, rot], i) => ({
    x: nx * width,
    y: ny * height,
    kind,
    color: colors[i % colors.length],
    size: kind === "leaf" ? Math.max(14, width * 0.022) : Math.max(6, width * 0.012),
    rot,
  }));
}

function drawLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rot: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(size * 0.7, -size * 0.15, 0, size);
  ctx.quadraticCurveTo(-size * 0.7, -size * 0.15, 0, -size);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.7);
  ctx.lineTo(0, size * 0.55);
  ctx.stroke();
  ctx.restore();
}

function paintConfetti(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  for (const piece of confettiPieces(width, height)) {
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.rot);
    ctx.fillStyle = piece.color;
    if (piece.kind === "rect") {
      fillRoundRect(ctx, -piece.size, -piece.size * 0.35, piece.size * 2, piece.size * 0.7, 2);
    } else if (piece.kind === "dot") {
      ctx.beginPath();
      ctx.arc(0, 0, piece.size * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.restore();
      drawLeaf(ctx, piece.x, piece.y, piece.size, piece.rot, piece.color);
      continue;
    }
    ctx.restore();
  }
}

function paintGlobe(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
) {
  ctx.save();
  const sphere = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  sphere.addColorStop(0, "#5EC8FF");
  sphere.addColorStop(0.45, "#2F8FE8");
  sphere.addColorStop(1, "#1A5FA8");
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = sphere;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#3DB54A";
  ctx.beginPath();
  ctx.ellipse(cx - radius * 0.25, cy - radius * 0.05, radius * 0.42, radius * 0.32, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + radius * 0.28, cy + radius * 0.18, radius * 0.28, radius * 0.2, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = Math.max(1.2, radius * 0.06);
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.38, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius * 0.78, radius * 0.28, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius);
  ctx.lineTo(cx, cy + radius);
  ctx.stroke();

  const orbitColors = [
    ONE_WORLD_COLORS.orange,
    ONE_WORLD_COLORS.teal,
    ONE_WORLD_COLORS.magenta,
    ONE_WORLD_COLORS.gold,
  ];
  orbitColors.forEach((color, i) => {
    const angle = -0.55 + i * 0.85;
    const ox = cx + Math.cos(angle) * (radius + 10);
    const oy = cy + Math.sin(angle) * (radius + 8);
    ctx.beginPath();
    ctx.arc(ox, oy, Math.max(3, radius * 0.12), 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });

  ctx.strokeStyle = "rgba(26, 39, 68, 0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 7, 0.15, 4.2);
  ctx.stroke();
  ctx.restore();
}

export function drawRainbowPhotoRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  photoRadius: number,
  ringWidth = 14
) {
  const colors = [
    ONE_WORLD_COLORS.orange,
    ONE_WORLD_COLORS.gold,
    ONE_WORLD_COLORS.teal,
    ONE_WORLD_COLORS.navy,
    ONE_WORLD_COLORS.magenta,
    ONE_WORLD_COLORS.orange,
  ];
  const radius = photoRadius + ringWidth * 0.55;
  const step = (Math.PI * 2) / (colors.length - 1);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = ringWidth;
  for (let i = 0; i < colors.length - 1; i++) {
    ctx.strokeStyle = colors[i];
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2 + i * step, -Math.PI / 2 + (i + 1) * step);
    ctx.stroke();
  }
  ctx.restore();
}

function wrapWords(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const test = `${current} ${words[i]}`;
    if (measureLineWidth(ctx, test) <= maxWidth) {
      current = test;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

function drawColorfulTitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSpec: string,
  align: "left" | "center",
  lineHeight: number
): number {
  ctx.font = fontSpec;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.direction = "ltr";
  const lines = wrapWords(ctx, text, maxWidth);
  let letterIndex = 0;
  let lineY = y;
  for (const line of lines) {
    let lineWidth = 0;
    for (const ch of line) {
      lineWidth += measureGlyphWidth(ctx, ch);
    }
    let cursor = align === "center" ? x - lineWidth / 2 : x;
    for (const ch of line) {
      if (ch !== " ") {
        ctx.fillStyle = TITLE_LETTER_COLORS[letterIndex % TITLE_LETTER_COLORS.length];
        letterIndex += 1;
      } else {
        ctx.fillStyle = ONE_WORLD_COLORS.navy;
      }
      ctx.fillText(ch, cursor, lineY);
      cursor += measureGlyphWidth(ctx, ch);
    }
    lineY += lineHeight;
  }
  return lineY;
}

function drawFlourish(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number
) {
  ctx.save();
  ctx.strokeStyle = ONE_WORLD_COLORS.teal;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + width * 0.25, y - 10, x + width * 0.5, y);
  ctx.quadraticCurveTo(x + width * 0.75, y + 10, x + width, y);
  ctx.stroke();
  ctx.fillStyle = ONE_WORLD_COLORS.orange;
  ctx.beginPath();
  ctx.ellipse(x + width * 0.5, y, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPin(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = ONE_WORLD_COLORS.orange;
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.quadraticCurveTo(x - size * 0.85, y - size * 0.1, x, y - size);
  ctx.quadraticCurveTo(x + size * 0.85, y - size * 0.1, x, y + size);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y - size * 0.28, size * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function paintHills(
  ctx: CanvasRenderingContext2D,
  width: number,
  y: number,
  height: number
) {
  ctx.save();
  ctx.fillStyle = "#C8E86A";
  ctx.beginPath();
  ctx.moveTo(0, y + height);
  ctx.lineTo(0, y + height * 0.55);
  ctx.quadraticCurveTo(width * 0.22, y - height * 0.15, width * 0.48, y + height * 0.45);
  ctx.quadraticCurveTo(width * 0.72, y + height * 0.05, width, y + height * 0.5);
  ctx.lineTo(width, y + height);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#B5DC5A";
  ctx.beginPath();
  ctx.moveTo(0, y + height);
  ctx.quadraticCurveTo(width * 0.35, y + height * 0.2, width, y + height * 0.65);
  ctx.lineTo(width, y + height);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPeopleIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  const heads = [
    [cx - size * 0.38, cy - size * 0.22],
    [cx + size * 0.38, cy - size * 0.22],
    [cx, cy - size * 0.38],
  ];
  for (const [hx, hy] of heads) {
    ctx.beginPath();
    ctx.arc(hx, hy, size * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.28, size * 0.55, size * 0.28, 0, Math.PI, 0, true);
  ctx.fill();
  ctx.restore();
}

function drawSparkleIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  const star = (x: number, y: number, r: number) => {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.38;
      const px = x + Math.cos(a) * rad;
      const py = y + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  };
  star(cx, cy, size * 0.42);
  star(cx + size * 0.42, cy - size * 0.28, size * 0.18);
  ctx.restore();
}

function drawHeartIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  const s = size * 0.42;
  ctx.moveTo(cx, cy + s * 0.7);
  ctx.bezierCurveTo(cx - s * 1.4, cy - s * 0.05, cx - s * 0.7, cy - s * 1.15, cx, cy - s * 0.35);
  ctx.bezierCurveTo(cx + s * 0.7, cy - s * 1.15, cx + s * 1.4, cy - s * 0.05, cx, cy + s * 0.7);
  ctx.fill();
  ctx.restore();
}

function drawActionIcon(
  ctx: CanvasRenderingContext2D,
  icon: ActionBlock["icon"],
  cx: number,
  cy: number,
  size: number
) {
  if (icon === "people") drawPeopleIcon(ctx, cx, cy, size);
  else if (icon === "sparkle") drawSparkleIcon(ctx, cx, cy, size);
  else drawHeartIcon(ctx, cx, cy, size);
}

function paintActionRow(
  ctx: CanvasRenderingContext2D,
  actions: ActionBlock[],
  y: number,
  width: number,
  height: number,
  theme: ResolvedFrameTheme
) {
  const blockW = width / actions.length;
  actions.forEach((action, i) => {
    const x = i * blockW;
    ctx.fillStyle = action.color;
    ctx.fillRect(x, y, blockW, height);
    drawActionIcon(ctx, action.icon, x + blockW / 2, y + height * 0.28, Math.min(36, height * 0.32));
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#ffffff";
    ctx.font = extraBold(theme, Math.round(height * 0.16));
    ctx.fillText(action.title, x + blockW / 2, y + height * 0.55);
    ctx.font = owFont(theme, 600, Math.round(height * 0.105));
    const lines = wrapWords(ctx, action.subtitle, blockW - 24);
    let lineY = y + height * 0.72;
    for (const line of lines.slice(0, 2)) {
      ctx.fillText(line, x + blockW / 2, lineY);
      lineY += Math.round(height * 0.12);
    }
  });
}

function paintBrandBar(
  ctx: CanvasRenderingContext2D,
  y: number,
  width: number,
  height: number,
  theme: ResolvedFrameTheme
) {
  ctx.fillStyle = ONE_WORLD_COLORS.navy;
  ctx.fillRect(0, y, width, height);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  ctx.font = extraBold(theme, Math.round(height * 0.36));
  ctx.fillText(BRAND_URL, width / 2, y + height * 0.42);
  ctx.font = owFont(theme, 600, Math.round(height * 0.18));
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.fillText(BRAND_TAGLINE, width / 2, y + height * 0.68);

  const waveY = y + height - 18;
  const waveColors = [
    ONE_WORLD_COLORS.orange,
    ONE_WORLD_COLORS.teal,
    ONE_WORLD_COLORS.magenta,
    ONE_WORLD_COLORS.navy,
  ];
  waveColors.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    const h = 8 - i;
    ctx.moveTo(0, waveY + i * 3 + h);
    for (let x = 0; x <= width; x += 20) {
      const yy = waveY + i * 3 + Math.sin((x / width) * Math.PI * 4 + i) * 4;
      ctx.lineTo(x, yy);
    }
    ctx.lineTo(width, y + height);
    ctx.lineTo(0, y + height);
    ctx.closePath();
    ctx.fill();
  });
}

export function paintOneWorldBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  paintCreamField(ctx, width, height);
  paintConfetti(ctx, width, height);
}

export function paintOneWorldThumbnail(
  ctx: CanvasRenderingContext2D,
  size: number
) {
  paintOneWorldBackground(ctx, size, size);
  paintGlobe(ctx, size * 0.18, size * 0.2, size * 0.1);
  drawRainbowPhotoRing(ctx, size * 0.32, size * 0.52, size * 0.18, Math.max(4, size * 0.04));
  ctx.fillStyle = ONE_WORLD_COLORS.cream;
  ctx.beginPath();
  ctx.arc(size * 0.32, size * 0.52, size * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ONE_WORLD_COLORS.orange;
  ctx.fillRect(0, size * 0.78, size / 3, size * 0.14);
  ctx.fillStyle = ONE_WORLD_COLORS.teal;
  ctx.fillRect(size / 3, size * 0.78, size / 3, size * 0.14);
  ctx.fillStyle = ONE_WORLD_COLORS.magenta;
  ctx.fillRect((size * 2) / 3, size * 0.78, size / 3, size * 0.14);
  ctx.fillStyle = ONE_WORLD_COLORS.navy;
  ctx.fillRect(0, size * 0.92, size, size * 0.08);
}

function fitTitleSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
  startSize: number,
  minSize: number,
  fontFamily: string
): number {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `800 ${size}px ${fontFamily}`;
    const lines = wrapWords(ctx, text, maxWidth);
    if (lines.length <= maxLines) return size;
    size -= 2;
  }
  return minSize;
}

export function drawOneWorldPersonalPoster(
  ctx: CanvasRenderingContext2D,
  event: EventWithOptions,
  theme: ResolvedFrameTheme,
  photo: HTMLImageElement,
  photoCrop: PhotoCrop,
  displayName: string,
  canvasW: number,
  canvasH: number
) {
  const scale = canvasW / 1080;
  paintOneWorldBackground(ctx, canvasW, canvasH);

  const globeR = Math.round(38 * scale);
  paintGlobe(ctx, Math.round(70 * scale), Math.round(72 * scale), globeR);

  const headerX = Math.round(130 * scale);
  const headerMaxW = canvasW - headerX - Math.round(40 * scale);
  const headerSize = fitTitleSize(
    ctx,
    event.name,
    headerMaxW,
    2,
    Math.round(44 * scale),
    Math.round(26 * scale),
    theme.paint.type.fontFamily
  );
  let cursorY = drawColorfulTitle(
    ctx,
    event.name,
    headerX,
    Math.round(58 * scale),
    headerMaxW,
    extraBold(theme, headerSize),
    "left",
    Math.round(headerSize * 1.08)
  );

  ctx.fillStyle = ONE_WORLD_COLORS.orange;
  ctx.font = extraBold(theme, Math.round(26 * scale));
  ctx.textAlign = "left";
  ctx.fillText(event.dateLabel.toUpperCase(), headerX, cursorY + Math.round(8 * scale));

  const photoX = Math.round(250 * scale);
  const photoR = Math.round(198 * scale);
  const photoY = Math.round(410 * scale);
  drawCircularImage(ctx, photo, photoX, photoY, photoR, photoCrop);
  drawRainbowPhotoRing(ctx, photoX, photoY, photoR, Math.round(14 * scale));

  const textX = photoX + photoR + Math.round(48 * scale);
  const textMaxW = canvasW - textX - Math.round(36 * scale);
  let textY = Math.round(250 * scale);

  ctx.fillStyle = ONE_WORLD_COLORS.teal;
  ctx.font = extraBold(theme, Math.round(22 * scale));
  ctx.textAlign = "left";
  ctx.fillText(resolveShout(event), textX, textY);
  textY += Math.round(18 * scale);
  drawFlourish(ctx, textX, textY, Math.min(textMaxW, Math.round(220 * scale)));
  textY += Math.round(48 * scale);

  const bodyTitleSize = fitTitleSize(
    ctx,
    event.name,
    textMaxW,
    3,
    Math.round(46 * scale),
    Math.round(24 * scale),
    theme.paint.type.fontFamily
  );
  textY = drawColorfulTitle(
    ctx,
    event.name,
    textX,
    textY,
    textMaxW,
    extraBold(theme, bodyTitleSize),
    "left",
    Math.round(bodyTitleSize * 1.1)
  );

  const tagline = event.tagline?.trim();
  if (tagline) {
    textY += Math.round(10 * scale);
    ctx.fillStyle = "rgba(26, 39, 68, 0.72)";
    ctx.font = owFont(theme, 600, Math.round(22 * scale));
    const tagLines = wrapWords(ctx, tagline, textMaxW);
    for (const line of tagLines.slice(0, 3)) {
      fillTextWithSpaces(ctx, line, textX, textY);
      textY += Math.round(28 * scale);
    }
  }

  if (displayName.trim()) {
    textY += Math.round(8 * scale);
    ctx.fillStyle = ONE_WORLD_COLORS.navy;
    ctx.font = extraBold(theme, Math.round(30 * scale));
    const nameLines = wrapWords(ctx, displayName.trim().toUpperCase(), textMaxW);
    for (const line of nameLines.slice(0, 2)) {
      ctx.fillText(line, textX, textY);
      textY += Math.round(34 * scale);
    }
  }

  const locationY = Math.round(680 * scale);
  paintHills(ctx, canvasW, locationY - Math.round(36 * scale), Math.round(50 * scale));
  const loc = event.location?.trim();
  if (loc) {
    drawPin(ctx, Math.round(70 * scale), locationY - Math.round(4 * scale), Math.round(16 * scale));
    ctx.fillStyle = ONE_WORLD_COLORS.navy;
    ctx.font = extraBold(theme, Math.round(26 * scale));
    ctx.textAlign = "left";
    ctx.fillText(loc.toUpperCase(), Math.round(98 * scale), locationY);
  }

  const actionH = Math.round(132 * scale);
  const actionY = Math.round(720 * scale);
  paintActionRow(ctx, resolveActions(event), actionY, canvasW, actionH, theme);

  const brandH = Math.round(128 * scale);
  paintBrandBar(ctx, actionY + actionH, canvasW, canvasH - (actionY + actionH), theme);
  void brandH;
}

export function drawOneWorldGroupPoster(
  ctx: CanvasRenderingContext2D,
  event: EventWithOptions,
  theme: ResolvedFrameTheme,
  photos: HTMLImageElement[],
  photoCrops: PhotoCrop[],
  groupName: string,
  canvasW: number,
  canvasH: number
) {
  const scale = canvasW / 1080;
  paintOneWorldBackground(ctx, canvasW, canvasH);

  const globeR = Math.round(38 * scale);
  paintGlobe(ctx, Math.round(70 * scale), Math.round(72 * scale), globeR);

  const headerX = Math.round(130 * scale);
  const headerMaxW = canvasW - headerX - Math.round(40 * scale);
  const headerSize = fitTitleSize(
    ctx,
    event.name,
    headerMaxW,
    2,
    Math.round(44 * scale),
    Math.round(26 * scale),
    theme.paint.type.fontFamily
  );
  let cursorY = drawColorfulTitle(
    ctx,
    event.name,
    headerX,
    Math.round(58 * scale),
    headerMaxW,
    extraBold(theme, headerSize),
    "left",
    Math.round(headerSize * 1.08)
  );
  ctx.fillStyle = ONE_WORLD_COLORS.orange;
  ctx.font = extraBold(theme, Math.round(26 * scale));
  ctx.textAlign = "left";
  ctx.fillText(event.dateLabel.toUpperCase(), headerX, cursorY + Math.round(8 * scale));

  const count = Math.max(1, photos.length);
  const clusterX = Math.round(250 * scale);
  const clusterY = Math.round(400 * scale);
  const clusterR =
    count === 1
      ? Math.round(198 * scale)
      : count === 2
        ? Math.round(132 * scale)
        : Math.round(108 * scale);
  const offsets =
    count === 1
      ? [[0, 0]]
      : count === 2
        ? [
            [-70, 8],
            [70, -8],
          ]
        : count === 3
          ? [
              [-78, 20],
              [78, 20],
              [0, -70],
            ]
          : [
              [-80, -70],
              [80, -70],
              [-80, 70],
              [80, 70],
            ];

  photos.forEach((photo, i) => {
    const [dx, dy] = offsets[i] ?? [0, 0];
    const x = clusterX + Math.round(dx * scale);
    const y = clusterY + Math.round(dy * scale);
    drawCircularImage(ctx, photo, x, y, clusterR, photoCrops[i]);
    drawRainbowPhotoRing(ctx, x, y, clusterR, Math.round(10 * scale));
  });

  const rightEdge =
    clusterX +
    clusterR +
    Math.round((count === 1 ? 48 : count === 2 ? 120 : 100) * scale);
  const textX = Math.min(rightEdge, Math.round(520 * scale));
  const textMaxW = canvasW - textX - Math.round(36 * scale);
  let textY = Math.round(250 * scale);

  ctx.fillStyle = ONE_WORLD_COLORS.teal;
  ctx.font = extraBold(theme, Math.round(22 * scale));
  ctx.textAlign = "left";
  ctx.fillText(resolveShout(event), textX, textY);
  textY += Math.round(18 * scale);
  drawFlourish(ctx, textX, textY, Math.min(textMaxW, Math.round(220 * scale)));
  textY += Math.round(48 * scale);

  const bodyTitleSize = fitTitleSize(
    ctx,
    event.name,
    textMaxW,
    3,
    Math.round(42 * scale),
    Math.round(22 * scale),
    theme.paint.type.fontFamily
  );
  textY = drawColorfulTitle(
    ctx,
    event.name,
    textX,
    textY,
    textMaxW,
    extraBold(theme, bodyTitleSize),
    "left",
    Math.round(bodyTitleSize * 1.1)
  );

  const tagline = event.tagline?.trim();
  if (tagline) {
    textY += Math.round(10 * scale);
    ctx.fillStyle = "rgba(26, 39, 68, 0.72)";
    ctx.font = owFont(theme, 600, Math.round(22 * scale));
    const tagLines = wrapWords(ctx, tagline, textMaxW);
    for (const line of tagLines.slice(0, 3)) {
      fillTextWithSpaces(ctx, line, textX, textY);
      textY += Math.round(28 * scale);
    }
  }

  const name = groupName.trim() || "Our Group";
  textY += Math.round(8 * scale);
  ctx.fillStyle = ONE_WORLD_COLORS.navy;
  ctx.font = extraBold(theme, Math.round(30 * scale));
  const nameLines = wrapWords(ctx, name.toUpperCase(), textMaxW);
  for (const line of nameLines.slice(0, 2)) {
    ctx.fillText(line, textX, textY);
    textY += Math.round(34 * scale);
  }

  const locationY = Math.round(680 * scale);
  paintHills(ctx, canvasW, locationY - Math.round(36 * scale), Math.round(50 * scale));
  const loc = event.location?.trim();
  if (loc) {
    drawPin(ctx, Math.round(70 * scale), locationY - Math.round(4 * scale), Math.round(16 * scale));
    ctx.fillStyle = ONE_WORLD_COLORS.navy;
    ctx.font = extraBold(theme, Math.round(26 * scale));
    ctx.textAlign = "left";
    ctx.fillText(loc.toUpperCase(), Math.round(98 * scale), locationY);
  }

  const actionH = Math.round(132 * scale);
  const actionY = Math.round(720 * scale);
  paintActionRow(ctx, resolveActions(event), actionY, canvasW, actionH, theme);
  paintBrandBar(ctx, actionY + actionH, canvasW, canvasH - (actionY + actionH), theme);
}

export function drawOneWorldPersonalDp(
  ctx: CanvasRenderingContext2D,
  event: EventWithOptions,
  theme: ResolvedFrameTheme,
  photo: HTMLImageElement,
  photoCrop: PhotoCrop,
  displayName: string,
  canvasW: number,
  canvasH: number
) {
  const scale = canvasW / 640;
  paintOneWorldBackground(ctx, canvasW, canvasH);
  paintGlobe(ctx, Math.round(48 * scale), Math.round(48 * scale), Math.round(26 * scale));

  const titleSize = fitTitleSize(
    ctx,
    event.name,
    canvasW - Math.round(90 * scale),
    2,
    Math.round(28 * scale),
    Math.round(16 * scale),
    theme.paint.type.fontFamily
  );
  drawColorfulTitle(
    ctx,
    event.name,
    Math.round(86 * scale),
    Math.round(42 * scale),
    canvasW - Math.round(110 * scale),
    extraBold(theme, titleSize),
    "left",
    Math.round(titleSize * 1.08)
  );

  const photoX = Math.round(200 * scale);
  const photoY = Math.round(270 * scale);
  const photoR = Math.round(118 * scale);
  drawCircularImage(ctx, photo, photoX, photoY, photoR, photoCrop);
  drawRainbowPhotoRing(ctx, photoX, photoY, photoR, Math.round(10 * scale));

  ctx.fillStyle = ONE_WORLD_COLORS.navy;
  ctx.font = extraBold(theme, Math.round(22 * scale));
  ctx.textAlign = "left";
  const nameX = photoX + photoR + Math.round(22 * scale);
  const nameMax = canvasW - nameX - Math.round(16 * scale);
  const nameLines = wrapWords(ctx, displayName.trim().toUpperCase() || event.name, nameMax);
  let nameY = photoY - Math.round(10 * scale);
  for (const line of nameLines.slice(0, 3)) {
    ctx.fillText(line, nameX, nameY);
    nameY += Math.round(26 * scale);
  }

  const actionH = Math.round(70 * scale);
  const actionY = canvasH - Math.round(118 * scale);
  paintActionRow(ctx, resolveActions(event), actionY, canvasW, actionH, theme);
  paintBrandBar(ctx, actionY + actionH, canvasW, canvasH - (actionY + actionH), theme);
}

export function drawOneWorldGroupDp(
  ctx: CanvasRenderingContext2D,
  event: EventWithOptions,
  theme: ResolvedFrameTheme,
  photos: HTMLImageElement[],
  photoCrops: PhotoCrop[],
  groupName: string,
  canvasW: number,
  canvasH: number
) {
  const scale = canvasW / 640;
  paintOneWorldBackground(ctx, canvasW, canvasH);
  paintGlobe(ctx, Math.round(48 * scale), Math.round(48 * scale), Math.round(26 * scale));
  const titleSize = fitTitleSize(
    ctx,
    event.name,
    canvasW - Math.round(90 * scale),
    2,
    Math.round(26 * scale),
    Math.round(16 * scale),
    theme.paint.type.fontFamily
  );
  drawColorfulTitle(
    ctx,
    event.name,
    Math.round(86 * scale),
    Math.round(42 * scale),
    canvasW - Math.round(110 * scale),
    extraBold(theme, titleSize),
    "left",
    Math.round(titleSize * 1.08)
  );

  const count = Math.max(1, photos.length);
  const r = count <= 2 ? Math.round(78 * scale) : Math.round(62 * scale);
  const cy = Math.round(270 * scale);
  const gap = r * 1.7;
  const startX = canvasW / 2 - ((count - 1) * gap) / 2;
  photos.forEach((photo, i) => {
    const x = startX + i * gap;
    drawCircularImage(ctx, photo, x, cy, r, photoCrops[i]);
    drawRainbowPhotoRing(ctx, x, cy, r, Math.round(8 * scale));
  });

  ctx.fillStyle = ONE_WORLD_COLORS.navy;
  ctx.font = extraBold(theme, Math.round(20 * scale));
  ctx.textAlign = "center";
  ctx.fillText((groupName.trim() || "Our Group").toUpperCase(), canvasW / 2, cy + r + Math.round(36 * scale));

  const actionH = Math.round(70 * scale);
  const actionY = canvasH - Math.round(118 * scale);
  paintActionRow(ctx, resolveActions(event), actionY, canvasW, actionH, theme);
  paintBrandBar(ctx, actionY + actionH, canvasW, canvasH - (actionY + actionH), theme);
}
