import type {
  FrameBorderStyle,
  FrameThemeColors,
  FrameThemeKey,
} from "../frame-themes";
import type { FrameFullOverlayConfig } from "../frame-overlays";
import { defaultClassicTagline } from "./taglines";
import { DEFAULT_ATTRIBUTION, posterType } from "./typography";
import type {
  FramePaint,
  FrameRoleBadge,
  FrameTaglinePaint,
  FrameTypography,
  PosterFrame,
} from "./types";

type ClassicFrameInput = {
  key: FrameThemeKey;
  name: string;
  description: string;
  colors: FrameThemeColors;
  borderStyle: FrameBorderStyle;
  photoRingWidth: number;
  overlayKey?: FrameThemeKey;
  overlay?: FrameFullOverlayConfig;
  posterTextColor?: string;
  layoutProfile?: "default" | "circular";
  type?: Partial<FrameTypography>;
  tagline?: Partial<FrameTaglinePaint>;
  roleBadge?: FrameRoleBadge;
  logoSize?: number;
};

/** Shared composition for frames that only change colors, type, and border. */
export function defineClassicFrame(def: ClassicFrameInput): PosterFrame {
  const posterTextColor = def.posterTextColor ?? "#ffffff";
  const paint: FramePaint = {
    layout: "classic",
    background: "solid-primary",
    paintOverlay: true,
    photoRing: "gold-accent",
    fullBleedLayout: false,
    photoWarmAccent: false,
    besidePhotoScale: 1,
    includeEventTagline: false,
    posterTextColor,
    nameColor: posterTextColor,
    nameLift: 0,
    logoSize: def.logoSize ?? 96,
    roleBadge: def.roleBadge,
    dividerStroke: def.posterTextColor
      ? "rgba(139, 52, 24, 0.35)"
      : "rgba(255, 255, 255, 0.35)",
    headlineColors: def.posterTextColor ? "token-or-poster" : "palette",
    attribution: { ...DEFAULT_ATTRIBUTION },
    type: posterType(def.type),
    tagline: defaultClassicTagline(posterTextColor, def.tagline),
  };

  return { ...def, paint };
}

export function eventDefaultPaint(): FramePaint {
  return defineClassicFrame({
    key: "youth",
    name: "Event default",
    description: "",
    colors: {
      primary: "#1a4d4a",
      accent: "#c9a227",
      background: "#f5f0e8",
      gold: "#D4AF37",
      green: "#2D8A4E",
    },
    borderStyle: "minimal",
    photoRingWidth: 8,
  }).paint;
}
