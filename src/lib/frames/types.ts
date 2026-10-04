import type {
  FrameBorderStyle,
  FrameThemeColors,
  FrameThemeKey,
} from "../frame-themes";
import type { FrameFullOverlayConfig } from "../frame-overlays";

export type OverlayNameSlot = {
  /** Name column X as a fraction of canvas width. */
  xRatio: number;
  /** Name baseline as a fraction of canvas height. */
  yRatio: number;
  maxWidthRatio: number;
  /** Keep the name above this Y (divider / footer art). */
  maxBottomRatio?: number;
  align: "center" | "left";
  color: string;
  /** Name size in design pixels at 1080. */
  fontSize: number;
};

/** Per-frame tagline layout. Overlay frames use a slot; classic/GS stack after the name. */
export type FrameTaglinePaint = {
  placement: "slot" | "after-name";
  align: "center" | "left";
  color: string;
  /** Design pixels at 1080. Each theme sets size/weight relative to the name. */
  fontSize: number;
  fontWeight: 500 | 600 | 700 | 800;
  lineHeight?: number;
  /** Extra space between the attendee name and the first tagline (after-name). */
  afterNameGap?: number;
  /**
   * Extra space after the event-tagline block, before "I'm attending" / the name.
   * When set, after-name copy paints as distinct event / attending / closing blocks.
   */
  afterEventGap?: number;
  /** Extra space after the attending/name block, before the closing line. */
  beforeClosingGap?: number;
  /** Closing/footer line size. Defaults to fontSize. */
  closingFontSize?: number;
  closingFontWeight?: 500 | 600 | 700 | 800;
  closingLineHeight?: number;
  /** Always stack taglines under the name instead of sitting on the same row. */
  stackBelowName?: boolean;
  xRatio?: number;
  yRatio?: number;
  maxWidthRatio?: number;
  maxBottomRatio?: number;
  /** Paint over baked-in sample copy before drawing organizer taglines. */
  cover?: {
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
    color: string;
  };
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
  personalNameWeight?: 700 | 800;
  personalTaglineSize: number;
  headerNameSize: number;
  headerNameWeight?: 600 | 700;
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
  /** Design pixels at 1080. Smaller than name and taglines. */
  fontSize?: number;
  uppercase?: boolean;
  /** Extra tracking in design pixels. */
  letterSpacing?: number;
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
  /** Each theme owns tagline size, weight, and placement. */
  tagline: FrameTaglinePaint;
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
