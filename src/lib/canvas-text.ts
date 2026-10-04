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

function breakLongWord(
  ctx: CanvasRenderingContext2D,
  word: string,
  maxWidth: number,
  lines: string[]
): string {
  if (!word) return "";
  if (measureLineWidth(ctx, word) <= maxWidth) return word;

  let chunk = "";
  for (const ch of word) {
    const test = chunk + ch;
    if (chunk && measureLineWidth(ctx, test) > maxWidth) {
      lines.push(chunk);
      chunk = ch;
    } else {
      chunk = test;
    }
  }
  return chunk;
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

    let line = "";
    const words = trimmed.includes(" ") ? trimmed.split(/\s+/) : [trimmed];
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (line && measureLineWidth(ctx, test) > maxWidth) {
        lines.push(line);
        line = breakLongWord(ctx, word, maxWidth, lines);
      } else if (!line && measureLineWidth(ctx, word) > maxWidth) {
        line = breakLongWord(ctx, word, maxWidth, lines);
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
