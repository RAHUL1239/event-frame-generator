import { DEFAULT_ATTRIBUTION, posterType } from "./typography";
import type { PosterFrame } from "./types";

const NAVY = "#2C3A4A";
const SAGE = "#4A5D4E";
const GOLD = "#C9A86C";
const CREAM = "#F3EEE4";

/**
 * Full PNG overlay. Photo composites into the left-center circular hole.
 * Florals and title stay as designed. The guest name sits under the
 * photo, above the footer. Organizer taglines replace the erased
 * "Good company. Beautiful memories." line.
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
    src: "/frames/grand-gala-frame.png?v=2",
    holeShape: "circle",
    holeCenterXRatio: 314.4 / 1024,
    holeCenterYRatio: 518.26 / 1024,
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
      xRatio: 0.5,
      yRatio: 0.818,
      maxWidthRatio: 0.72,
      maxBottomRatio: 0.836,
      align: "center",
      color: NAVY,
      fontSize: 36,
    },
    tagline: {
      placement: "slot",
      align: "left",
      color: SAGE,
      fontSize: 40,
      fontWeight: 700,
      lineHeight: 46,
      xRatio: 0.705,
      yRatio: 0.548,
      maxWidthRatio: 0.232,
      maxBottomRatio: 0.678,
    },
  },
};
