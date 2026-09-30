import { DEFAULT_ATTRIBUTION, posterType } from "./typography";
import type { PosterFrame } from "./types";

const NAVY = "#1A2B56";
const ORANGE = "#E85D33";
const CREAM = "#FFF9F0";
const CREAM_WARM = "#F8E8DF";
const TEAL = "#1B827E";
const GOLD = "#D4AF37";

/**
 * Cream flyer. No border image on the poster itself — the look is the
 * background, type, and photo ring declared here.
 */
export const gauravshaliSohlaFrame: PosterFrame = {
  key: "gauravshali-sohla",
  name: "Gauravshali Sohla",
  description: "Cream flyer with navy, orange, and teal accents",
  colors: {
    primary: NAVY,
    accent: ORANGE,
    background: CREAM,
    gold: GOLD,
    green: TEAL,
  },
  borderStyle: "classic",
  photoRingWidth: 5,
  overlayKey: "gauravshali-sohla",
  posterTextColor: NAVY,
  overlay: {
    src: "/frames/gauravshali-sohla-frame.png?v=4",
    holeInsetRatio: 72 / 1080,
    contentPadding: 50,
  },
  paint: {
    layout: "gs-flyer",
    background: "gs-cream",
    paintOverlay: false,
    photoRing: "gs",
    fullBleedLayout: true,
    photoWarmAccent: true,
    besidePhotoScale: 1.28,
    includeEventTagline: true,
    posterTextColor: NAVY,
    nameColor: NAVY,
    nameLift: 0,
    logoSize: 140,
    dividerStroke: "rgba(26, 43, 86, 0.28)",
    headlineColors: "token-or-poster",
    attribution: { ...DEFAULT_ATTRIBUTION },
    type: posterType(),
    creamBackground: {
      gradientStops: ["#FFF0E8", "#FFF6EF", CREAM, CREAM_WARM],
      textureLine: "rgba(196, 154, 88, 0.32)",
      textureDot: "rgba(196, 154, 88, 0.48)",
    },
    gsHeader: {
      fullBleed: true,
      logoMatte: true,
      logoSize: 140,
      eventNameColor: NAVY,
      eventNameSize: 32,
      eventNameLine: 28,
      dateColor: ORANGE,
      dateSize: 29,
      hashtagColor: TEAL,
      hashtagSize: 37,
      taglineColor: ORANGE,
      taglineSize: 30,
      taglineLine: 36,
    },
    gsFooter: {
      barBounds: "full",
      sideInset: 0,
      venueBarColor: "#E8EEF4",
      venueTextColor: NAVY,
      barColor: NAVY,
      sectionGap: 4,
      contentBottom: "flyer",
      iconColor: NAVY,
      socialHandleColor: GOLD,
    },
  },
};
