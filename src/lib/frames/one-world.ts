import { DEFAULT_ATTRIBUTION, posterType } from "./typography";
import type { PosterFrame } from "./types";

const NAVY = "#1A2744";
const ORANGE = "#F15A24";
const TEAL = "#00B5B8";
const MAGENTA = "#E91E8C";
const CREAM = "#FFF8F2";
const GOLD = "#F4B400";
const GREEN = "#3DB54A";

/**
 * Community-festival flyer. Cream field, rainbow photo ring, colorful
 * title, three action blocks, and an RSVPShare brand bar. Drawn in canvas
 * — no SAMPLE EVENT stamp on customer posters.
 */
export const oneWorldFrame: PosterFrame = {
  key: "one-world",
  name: "One World",
  description: "Cream festival flyer with a rainbow photo ring and colorful title",
  colors: {
    primary: NAVY,
    accent: ORANGE,
    background: CREAM,
    gold: GOLD,
    green: GREEN,
  },
  borderStyle: "minimal",
  photoRingWidth: 14,
  posterTextColor: NAVY,
  paint: {
    layout: "one-world",
    background: "one-world",
    paintOverlay: false,
    photoRing: "rainbow",
    fullBleedLayout: true,
    photoWarmAccent: false,
    besidePhotoScale: 1,
    includeEventTagline: true,
    posterTextColor: NAVY,
    nameColor: NAVY,
    nameLift: 0,
    logoSize: 0,
    dividerStroke: "rgba(26, 39, 68, 0.16)",
    headlineColors: "token-or-poster",
    attribution: {
      ...DEFAULT_ATTRIBUTION,
      text: "",
      bottomInset: 0,
    },
    type: posterType({
      fontFamily: '"Nunito", "Noto Sans", system-ui, sans-serif',
      headlineSize: 52,
      headlineLine: 56,
      personalNameSize: 34,
      personalTaglineSize: 24,
      headerNameSize: 44,
      headerNameLine: 48,
      headerVenueSize: 26,
      headerHashtagSize: 22,
      attributionSize: 0,
    }),
    creamBackground: {
      gradientStops: [CREAM, "#FFF6EC", CREAM, "#FFF1E4"],
      textureLine: "rgba(241, 90, 36, 0.04)",
      textureDot: "rgba(0, 181, 184, 0.08)",
    },
  },
};

export const ONE_WORLD_COLORS = {
  navy: NAVY,
  orange: ORANGE,
  teal: TEAL,
  magenta: MAGENTA,
  cream: CREAM,
  gold: GOLD,
  green: GREEN,
} as const;
