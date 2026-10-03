import type { FramePaint } from "./frames/types";
import { POSTER_FRAMES } from "./frames";
import { eventDefaultPaint } from "./frames/classic";

export type { FramePaint } from "./frames/types";
export { drawFrameThemeDecoration } from "./frames/vector-border";

export const FRAME_THEME_KEYS = [
  "traditional-maharashtrian",
  "elegant-gold",
  "gauravshali-sohla",
  "youth",
  "family",
  "volunteer",
  "sponsor",
  "one-world",
  "grand-gala",
  "wild-zoo",
  "christmas-together",
  "ideas-impact",
  "sunset-sound",
] as const;

export type FrameThemeKey = (typeof FRAME_THEME_KEYS)[number];

export type FrameBorderStyle =
  | "classic"
  | "ornate"
  | "minimal"
  | "bold"
  | "double"
  | "premium";

export type FrameThemeColors = {
  primary: string;
  accent: string;
  background: string;
  gold: string;
  green: string;
};

export type FrameThemeDefinition = {
  key: FrameThemeKey;
  name: string;
  description: string;
  colors: FrameThemeColors;
  borderStyle: FrameBorderStyle;
  photoRingWidth: number;
  overlayKey?: FrameThemeKey;
  /** Poster text color when the frame interior is light. */
  posterTextColor?: string;
  /** Circular frames keep content inside the round boundary. */
  layoutProfile?: "default" | "circular";
  paint: FramePaint;
};

function framesByKey(): Record<FrameThemeKey, FrameThemeDefinition> {
  const record = {} as Record<FrameThemeKey, FrameThemeDefinition>;
  for (const frame of POSTER_FRAMES) {
    record[frame.key] = frame;
  }
  for (const key of FRAME_THEME_KEYS) {
    if (!record[key]) {
      throw new Error(`Missing frame module for "${key}"`);
    }
  }
  return record;
}

export const FRAME_THEMES: Record<FrameThemeKey, FrameThemeDefinition> =
  framesByKey();

export const FRAME_THEME_LIST = FRAME_THEME_KEYS.map((key) => FRAME_THEMES[key]);

export type ResolvedFrameTheme = {
  key: FrameThemeKey | null;
  name: string;
  colors: FrameThemeColors;
  borderStyle: FrameBorderStyle;
  photoRingWidth: number;
  overlayKey?: FrameThemeKey;
  posterTextColor?: string;
  layoutProfile?: "default" | "circular";
  paint: FramePaint;
};

export function isFrameThemeKey(value: string): value is FrameThemeKey {
  return FRAME_THEME_KEYS.includes(value as FrameThemeKey);
}

export function parseEnabledFrameThemes(
  raw: string | null | undefined
): FrameThemeKey[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const unique = parsed.filter(
      (key): key is FrameThemeKey =>
        typeof key === "string" && isFrameThemeKey(key)
    );
    return [...new Set(unique)].slice(0, 3);
  } catch {
    return [];
  }
}

export function normalizeEnabledFrameThemes(input: unknown): FrameThemeKey[] {
  if (!Array.isArray(input)) return [];
  const unique = input.filter(
    (key): key is FrameThemeKey => typeof key === "string" && isFrameThemeKey(key)
  );
  return [...new Set(unique)].slice(0, 3);
}

export function serializeEnabledFrameThemes(themes: FrameThemeKey[]): string {
  return JSON.stringify(normalizeEnabledFrameThemes(themes));
}

export function serializeEnabledFrameThemesOrNull(
  input: unknown
): string | null {
  const normalized = normalizeEnabledFrameThemes(input);
  return normalized.length > 0 ? serializeEnabledFrameThemes(normalized) : null;
}

export function resolveFrameTheme(
  event: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    enabledFrameThemes?: string | null;
  },
  selectedKey?: string | null
): ResolvedFrameTheme {
  const enabled = parseEnabledFrameThemes(event.enabledFrameThemes);

  if (enabled.length === 0) {
    return {
      key: null,
      name: "Event default",
      colors: {
        primary: event.primaryColor,
        accent: event.accentColor,
        background: event.backgroundColor,
        gold: "#D4AF37",
        green: "#2D8A4E",
      },
      borderStyle: "minimal",
      photoRingWidth: 8,
      paint: eventDefaultPaint(),
    };
  }

  const key =
    selectedKey && isFrameThemeKey(selectedKey) && enabled.includes(selectedKey)
      ? selectedKey
      : enabled[0];
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
    paint: theme.paint,
  };
}
