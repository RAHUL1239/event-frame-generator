import type { FrameBorderStyle } from "../frame-themes";

export type VectorBorderTheme = {
  borderStyle: FrameBorderStyle;
  colors: { primary: string; accent: string };
  overlayKey?: string;
};

/** Vector frame borders used when a frame has no border image. */
export function drawFrameThemeDecoration(
  ctx: CanvasRenderingContext2D,
  theme: VectorBorderTheme,
  width: number,
  height: number,
  options?: { onDarkBackground?: boolean; skipWhenOverlay?: boolean }
) {
  if (options?.skipWhenOverlay && theme.overlayKey) return;

  const { primary, accent } = theme.colors;
  const outerStroke = options?.onDarkBackground ? accent : primary;
  const innerStroke = accent;
  const inset = Math.max(8, Math.round((width * 36) / 1080));
  const lineScale = width / 1080;

  switch (theme.borderStyle) {
    case "ornate": {
      ctx.strokeStyle = outerStroke;
      ctx.lineWidth = 5;
      ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
      ctx.strokeStyle = innerStroke;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        inset + 10,
        inset + 10,
        width - (inset + 10) * 2,
        height - (inset + 10) * 2
      );
      break;
    }
    case "bold": {
      ctx.strokeStyle = outerStroke;
      ctx.lineWidth = 14;
      ctx.strokeRect(8, 8, width - 16, height - 16);
      ctx.strokeStyle = innerStroke;
      ctx.lineWidth = 4;
      ctx.strokeRect(22, 22, width - 44, height - 44);
      break;
    }
    case "double": {
      ctx.strokeStyle = outerStroke;
      ctx.lineWidth = 4;
      ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
      ctx.strokeStyle = innerStroke;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        inset + 8,
        inset + 8,
        width - (inset + 8) * 2,
        height - (inset + 8) * 2
      );
      break;
    }
    case "premium": {
      ctx.strokeStyle = innerStroke;
      ctx.lineWidth = 3;
      ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
      ctx.strokeStyle = options?.onDarkBackground ? "#ffffff" : primary;
      ctx.lineWidth = 1;
      ctx.strokeRect(
        inset + 6,
        inset + 6,
        width - (inset + 6) * 2,
        height - (inset + 6) * 2
      );
      break;
    }
    case "classic": {
      const corner = 48;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      [
        [inset, inset + corner, inset, inset, inset + corner, inset],
        [
          width - inset - corner,
          inset,
          width - inset,
          inset,
          width - inset,
          inset + corner,
        ],
        [
          inset,
          height - inset - corner,
          inset,
          height - inset,
          inset + corner,
          height - inset,
        ],
        [
          width - inset - corner,
          height - inset,
          width - inset,
          height - inset,
          width - inset,
          height - inset - corner,
        ],
      ].forEach((segment) => {
        ctx.beginPath();
        ctx.moveTo(segment[0], segment[1]);
        ctx.lineTo(segment[2], segment[3]);
        ctx.lineTo(segment[4], segment[5]);
        ctx.stroke();
      });
      break;
    }
    case "minimal":
    default: {
      const outerWidth = Math.max(3, 8 * lineScale);
      const innerWidth = Math.max(1, 2 * lineScale);
      const innerGap = Math.max(4, 8 * lineScale);

      ctx.strokeStyle = accent;
      ctx.lineWidth = outerWidth;
      ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

      if (options?.onDarkBackground) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = innerWidth;
        ctx.strokeRect(
          inset + innerGap,
          inset + innerGap,
          width - (inset + innerGap) * 2,
          height - (inset + innerGap) * 2
        );
      }
      break;
    }
  }
}
