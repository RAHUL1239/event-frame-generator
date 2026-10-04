import { DEFAULT_ATTRIBUTION, posterType } from "./typography";
import type { PosterFrame } from "./types";

const EVERGREEN = "#1F3D2B";
const BURGUNDY = "#8B1E2D";
const GOLD = "#C9A86C";
const CREAM = "#F7F1E6";

/**
 * Full PNG overlay. Photo composites into the left-center circular hole.
 * Pine, holly, and title stay as designed. Name stays in the right
 * column; taglines sit below it, above the artwork divider.
 */
export const christmasTogetherFrame: PosterFrame = {
  key: "christmas-together",
  name: "Christmas Together",
  description: "Holiday gathering with a circular photo hole",
  colors: {
    primary: EVERGREEN,
    accent: BURGUNDY,
    background: CREAM,
    gold: GOLD,
    green: EVERGREEN,
  },
  borderStyle: "minimal",
  photoRingWidth: 0,
  overlayKey: "christmas-together",
  posterTextColor: EVERGREEN,
  overlay: {
    src: "/frames/christmas-together-frame.png?v=1",
    holeShape: "circle",
    holeCenterXRatio: 329.5 / 1024,
    holeCenterYRatio: 548 / 1024,
    holeRadiusRatio: 269 / 1024,
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
    posterTextColor: EVERGREEN,
    nameColor: EVERGREEN,
    nameLift: 0,
    logoSize: 0,
    dividerStroke: "rgba(31, 61, 43, 0.2)",
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
      yRatio: 0.34,
      maxWidthRatio: 0.36,
      maxBottomRatio: 0.52,
      align: "left",
      color: EVERGREEN,
      fontSize: 42,
    },
    tagline: {
      placement: "slot",
      align: "left",
      color: BURGUNDY,
      fontSize: 38,
      fontWeight: 700,
      lineHeight: 44,
      xRatio: 0.6,
      yRatio: 0.56,
      maxWidthRatio: 0.36,
      maxBottomRatio: 0.73,
    },
  },
};
