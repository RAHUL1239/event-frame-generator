import { DEFAULT_ATTRIBUTION, posterType } from "./typography";
import type { PosterFrame } from "./types";

const PURPLE = "#5C2A5A";
const TERRACOTTA = "#C4785A";
const CREAM = "#F8EEE6";
const GOLD = "#C9A86C";

/**
 * Full PNG overlay. Photo composites into the left-center circular hole.
 * Waves and title stay as designed. Name and admin taglines paint
 * on top of the overlay in the right column, above the divider.
 */
export const sunsetSoundFrame: PosterFrame = {
  key: "sunset-sound",
  name: "Sunset Sound Festival",
  description: "Music festival flyer with a circular photo hole",
  colors: {
    primary: PURPLE,
    accent: TERRACOTTA,
    background: CREAM,
    gold: GOLD,
    green: PURPLE,
  },
  borderStyle: "minimal",
  photoRingWidth: 0,
  overlayKey: "sunset-sound",
  posterTextColor: PURPLE,
  overlay: {
    src: "/frames/sunset-sound-festival-frame.png?v=1",
    holeShape: "circle",
    holeCenterXRatio: 333 / 1024,
    holeCenterYRatio: 529 / 1024,
    holeRadiusRatio: 283 / 1024,
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
    posterTextColor: PURPLE,
    nameColor: PURPLE,
    nameLift: 0,
    logoSize: 0,
    dividerStroke: "rgba(92, 42, 90, 0.2)",
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
      xRatio: 0.62,
      yRatio: 0.3,
      maxWidthRatio: 0.34,
      maxBottomRatio: 0.645,
      align: "left",
      color: PURPLE,
      taglineColor: TERRACOTTA,
      taglineSize: 26,
      fontSize: 42,
    },
  },
};
