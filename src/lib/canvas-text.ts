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
        if (ctx.measureText(test).width > maxWidth && line) {
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
      if (ctx.measureText(test).width > maxWidth && line) {
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
  const width = ctx.measureText(line).width;
  ctx.fillText(line, centerX - width / 2, y);
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
