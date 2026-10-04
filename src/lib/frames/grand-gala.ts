import { DEFAULT_ATTRIBUTION, posterType } from "./typography";
import type { PosterFrame } from "./types";

const NAVY = "#2C3A4A";
const SAGE = "#4A5D4E";
const GOLD = "#C9A86C";
const CREAM = "#F3EEE4";

/**
 * Full PNG overlay. Photo composites into the left-center circular hole.
 * Florals and title stay as designed. The guest name sits in the right
 * column. Organizer taglines cover the baked-in sample line
 * "Good company. Beautiful memories."
 */
export const grandGalaFrame: PosterFrame = {
  key: "grand-gala",
  name: "Grand Gala",
  description: "Pastel gala invitation with a circular photo hole",
  colors: {
    primary: NAVY,
    accent: GOLD,
    background: CREAM,
    gold: GOLD,
    green: SAGE,
  },
  borderStyle: "minimal",
  photoRingWidth: 0,
  overlayKey: "grand-gala",
  posterTextColor: NAVY,
  overlay: {
    src: "/frames/grand-gala-frame.png?v=1",
    holeShape: "circle",
    holeCenterXRatio: 315.1 / 1024,
    holeCenterYRatio: 518.35 / 1024,
    holeRadiusRatio: 270.5 / 1024,
  },
  paint: {
    layout: "overlay-hole",
    background: "solid-primary",
    paintOverlay: true,
    photoRing: "none",
    fullBleedLayout: true,
    photoWarmAccent: false,
    besidePhotoScale: 1,
    includeEventTagline: false,
    posterTextColor: NAVY,
    nameColor: NAVY,
    nameLift: 0,
    logoSize: 0,
    dividerStroke: "rgba(44, 58, 74, 0.2)",
    headlineColors: "token-or-poster",
    attribution: {
      ...DEFAULT_ATTRIBUTION,
      text: "",
    },
    type: posterType({
      fontFamily: 'Palatino, "Palatino Linotype", "Times New Roman", serif',
      personalNameSize: 46,
    }),
    overlayName: {
      xRatio: 0.6,
      yRatio: 0.4,
      maxWidthRatio: 0.36,
      maxBottomRatio: 0.52,
      align: "left",
      color: NAVY,
      fontSize: 42,
    },
    tagline: {
      placement: "slot",
      align: "left",
      color: SAGE,
      fontSize: 40,
      fontWeight: 700,
      lineHeight: 46,
      xRatio: 0.638,
      yRatio: 0.548,
      maxWidthRatio: 0.300,
      maxBottomRatio: 0.665,
      cover: {
        xRatio: 0.620,
        yRatio: 0.508,
        widthRatio: 0.335,
        heightRatio: 0.155,
        color: CREAM,
      },
    },
  },
};
