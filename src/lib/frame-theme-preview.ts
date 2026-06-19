import {
  drawFrameThemeDecoration,
  FRAME_THEMES,
  type FrameThemeKey,
  type ResolvedFrameTheme,
} from "./frame-themes";
import { hasFrameOverlayTheme, paintFrameFullOverlay } from "./frame-overlays";

const THUMBNAIL_SIZE = 96;

function toResolvedTheme(key: FrameThemeKey): ResolvedFrameTheme {
  const theme = FRAME_THEMES[key];
  return {
    key,
    name: theme.name,
    colors: theme.colors,
    borderStyle: theme.borderStyle,
    photoRingWidth: theme.photoRingWidth,
    overlayKey: theme.overlayKey,
    posterTextColor: theme.posterTextColor,
    layoutProfile: theme.layoutProfile,
  };
}

export async function renderFrameThemeThumbnail(
  canvas: HTMLCanvasElement,
  themeKey: FrameThemeKey,
  size = THUMBNAIL_SIZE
): Promise<void> {
  const theme = FRAME_THEMES[themeKey];
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = theme.colors.primary;
  ctx.fillRect(0, 0, size, size);

  if (hasFrameOverlayTheme(themeKey)) {
    await paintFrameFullOverlay(ctx, themeKey, size, size);
    return;
  }

  drawFrameThemeDecoration(ctx, toResolvedTheme(themeKey), size, size, {
    onDarkBackground: true,
    skipWhenOverlay: false,
  });
}

export const FRAME_THEME_THUMBNAIL_SIZE = THUMBNAIL_SIZE;
