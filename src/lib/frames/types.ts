import type {
  FrameBorderStyle,
  FrameThemeColors,
  FrameThemeKey,
} from "../frame-themes";
import type { FrameFullOverlayConfig } from "../frame-overlays";

export type OverlayNameSlot = {
  /** Name anchor X as a fraction of canvas width. */
  xRatio: number;
  /** Name baseline Y as a fraction of canvas height. */
  yRatio: number;
  maxWidthRatio: number;
  align: "center" | "left";
  color: string;
  /** Font size in design pixels at 1080. */
  fontSize: number;
};

export type FrameLayout =
  | "gs-flyer"
  | "gs-framed"
  | "classic"
  | "one-world"
  | "overlay-hole";
export type FrameBackground = "gs-cream" | "solid-primary" | "one-world";
export type FramePhotoRing = "none" | "gs" | "gold-accent" | "rainbow";
export type HeadlineColorMode = "token-or-white" | "token-or-poster" | "palette";

/** Type scale for poster copy. Sizes are design pixels at 1080, before layout scale. */
export type FrameTypography = {
  fontFamily: string;
  headlineSize: number;
  headlineLine: number;
  personalNameSize: number;
  personalTaglineSize: number;
  headerNameSize: number;
  headerNameLine: number;
  headerVenueSize: number;
  headerHashtagSize: number;
  attributionSize: number;
};

export type CreamBackground = {
  gradientStops: [string, string, string, string];
  textureLine: string;
  textureDot: string;
};

export type FrameRoleBadge = {
  text: string;
  background: string;
  color: string;
};

export type GsHeaderStyle = {
  fullBleed: boolean;
  logoMatte: boolean;
  logoSize: number;
  eventNameColor: string;
  eventNameSize: number;
  eventNameLine: number;
  dateColor: string;
  dateSize: number;
  hashtagColor: string;
  hashtagSize: number;
  taglineColor: string;
  taglineSize: number;
  taglineLine: number;
};

export type GsFooterStyle = {
  barBounds: "full" | "inset-50";
  sideInset: number;
  venueBarColor: string;
  venueTextColor: string;
  barColor: string;
  sectionGap: number;
  contentBottom: "framed" | "flyer";
  iconColor: string;
  socialHandleColor: string;
};

export type FrameAttribution = {
  text: string;
  raise: number;
  bottomInset: number;
  /** Bottom inset comes from the overlay border instead of bottomInset. */
  useOverlayInset: boolean;
};

/**
 * Everything that makes one frame look different from another:
 * colors, type, border treatment, and which poster composition to use.
 */
export type FramePaint = {
  layout: FrameLayout;
  background: FrameBackground;
  /** Paint the border image or vector border after the poster content. */
  paintOverlay: boolean;
  photoRing: FramePhotoRing;
  /** Ignore the overlay hole and lay content out on the full canvas. */
  fullBleedLayout: boolean;
  photoWarmAccent: boolean;
  /** Scale for the name/headline column on the personal poster. */
  besidePhotoScale: number;
  includeEventTagline: boolean;
  posterTextColor: string;
  nameColor: string;
  /** Move the name block up by this many design pixels. */
  nameLift: number;
  /** Max logo edge in design pixels at 1080. */
  logoSize: number;
  /** Optional pill drawn beside the classic header logo. */
  roleBadge?: FrameRoleBadge;
  dividerStroke: string;
  headlineColors: HeadlineColorMode;
  attribution: FrameAttribution;
  type: FrameTypography;
  creamBackground?: CreamBackground;
  gsHeader?: GsHeaderStyle;
  gsFooter?: GsFooterStyle;
  /** Guest name drawn after the PNG overlay, in a safe empty area. */
  overlayName?: OverlayNameSlot;
};

export type PosterFrame = {
  key: FrameThemeKey;
  name: string;
  description: string;
  colors: FrameThemeColors;
  borderStyle: FrameBorderStyle;
  photoRingWidth: number;
  overlayKey?: FrameThemeKey;
  posterTextColor?: string;
  layoutProfile?: "default" | "circular";
  /** Border image. Registered for layout insets and the admin thumbnail. */
  overlay?: FrameFullOverlayConfig;
  paint: FramePaint;
};
