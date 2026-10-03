const SPACE = " ";

/** Some canvas fonts report 0 advance for U+0020. Infer a real space width. */
export function measureGlyphWidth(
  ctx: CanvasRenderingContext2D,
  ch: string
): number {
  const native = ctx.measureText(ch).width;
  if (ch !== SPACE || native > 0.5) return native;
  const inferred =
    ctx.measureText(`x${SPACE}x`).width - ctx.measureText("xx").width;
  if (inferred > 0.5) return inferred;
  const em = ctx.measureText("M").width || 16;
  return em * 0.33;
}

export function measureLineWidth(
  ctx: CanvasRenderingContext2D,
  text: string
): number {
  const nativeSpace = ctx.measureText(SPACE).width;
  if (nativeSpace > 0.5 || !text.includes(SPACE)) {
    return ctx.measureText(text).width;
  }
  let width = 0;
  for (const ch of text) {
    width += measureGlyphWidth(ctx, ch);
  }
  return width;
}

export function fillTextWithSpaces(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth?: number
) {
  const nativeSpace = ctx.measureText(SPACE).width;
  if (nativeSpace > 0.5 || !text.includes(SPACE)) {
    if (maxWidth != null) ctx.fillText(text, x, y, maxWidth);
    else ctx.fillText(text, x, y);
    return;
  }

  const width = measureLineWidth(ctx, text);
  let cursor = x;
  if (ctx.textAlign === "center") cursor = x - width / 2;
  else if (ctx.textAlign === "right" || ctx.textAlign === "end") {
    cursor = x - width;
  }

  const prevAlign = ctx.textAlign;
  ctx.textAlign = "left";
  for (const ch of text) {
    const advance = measureGlyphWidth(ctx, ch);
    if (ch !== SPACE) ctx.fillText(ch, cursor, y);
    cursor += advance;
  }
  ctx.textAlign = prevAlign;
}

export function splitTextIntoLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text.trim()) return [];

  const lines: string[] = [];
  const paragraphs = text.split(/\n/);

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    if (trimmed.includes(" ")) {
      let line = "";
      for (const word of trimmed.split(/\s+/)) {
        const test = line ? `${line} ${word}` : word;
        if (measureLineWidth(ctx, test) > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      continue;
    }

    let line = "";
    for (const char of trimmed) {
      const test = line + char;
      if (measureLineWidth(ctx, test) > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }

  return lines;
}

export function fillCenteredLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  centerX: number,
  y: number
) {
  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const width = measureLineWidth(ctx, line);
  fillTextWithSpaces(ctx, line, centerX - width / 2, y);
}

export function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines = splitTextIntoLines(ctx, text, maxWidth);
  let currentY = y;
  for (const line of lines) {
    fillCenteredLine(ctx, line, centerX, currentY);
    currentY += lineHeight;
  }
  return currentY;
}
