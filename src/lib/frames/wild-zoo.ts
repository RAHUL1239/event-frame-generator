import { DEFAULT_ATTRIBUTION, posterType } from "./typography";
import type { PosterFrame } from "./types";

const GREEN = "#1B6B2A";
const TEAL = "#0F8A7A";
const ORANGE = "#F15A24";
const CREAM = "#FFF9F0";
const GOLD = "#F4B400";

/**
 * Full PNG overlay. Photo composites into the left-center circular hole.
 * Animals, leaves, and baked-in copy stay as designed — not redrawn.
 */
export const wildZooFrame: PosterFrame = {
  key: "wild-zoo",
  name: "Wild About the Zoo",
  description: "Jungle zoo day with a circular photo hole",
  colors: {
    primary: GREEN,
    accent: ORANGE,
    background: CREAM,
    gold: GOLD,
    green: TEAL,
  },
  borderStyle: "bold",
  photoRingWidth: 0,
  overlayKey: "wild-zoo",
  posterTextColor: GREEN,
  overlay: {
    src: "/frames/wild-about-the-zoo-frame.png?v=1",
    holeShape: "circle",
    holeCenterXRatio: 286.69 / 1024,
    holeCenterYRatio: 414.12 / 1024,
    holeRadiusRatio: 211.2 / 1024,
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
    posterTextColor: GREEN,
    nameColor: GREEN,
    nameLift: 0,
    logoSize: 0,
    dividerStroke: "rgba(27, 107, 42, 0.2)",
    headlineColors: "token-or-poster",
    attribution: {
      ...DEFAULT_ATTRIBUTION,
      text: "",
    },
    type: posterType({
      fontFamily: '"Nunito", "Noto Sans", system-ui, sans-serif',
      personalNameSize: 28,
    }),
    overlayName: {
      xRatio: 0.54,
      yRatio: 0.635,
      maxWidthRatio: 0.4,
      align: "left",
      color: GREEN,
      fontSize: 26,
    },
  },
};
