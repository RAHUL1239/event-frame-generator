import { DEFAULT_ATTRIBUTION, posterType } from "./typography";
import type { PosterFrame } from "./types";

const NAVY = "#243447";
const GOLD = "#C4A574";
const SLATE = "#6B8499";
const CREAM = "#F6F3EE";

/**
 * Full PNG overlay. Photo composites into the left rounded-rect hole.
 * Title stays as designed. Name stays in the right column; taglines
 * sit below it, above the artwork divider.
 */
export const ideasImpactFrame: PosterFrame = {
  key: "ideas-impact",
  name: "Ideas & Impact Summit",
  description: "Summit invitation with a rounded rectangular photo hole",
  colors: {
    primary: NAVY,
    accent: GOLD,
    background: CREAM,
    gold: GOLD,
    green: SLATE,
  },
  borderStyle: "minimal",
  photoRingWidth: 0,
  overlayKey: "ideas-impact",
  posterTextColor: NAVY,
  overlay: {
    src: "/frames/ideas-impact-summit-frame.png?v=1",
    holeShape: "rounded-rect",
    holeXRatio: 57 / 1024,
    holeYRatio: 249 / 1024,
    holeWidthRatio: 467 / 1024,
    holeHeightRatio: 624 / 1024,
    holeCornerRadiusRatio: 40 / 1024,
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
    dividerStroke: "rgba(36, 52, 71, 0.2)",
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
      xRatio: 0.54,
      yRatio: 0.3,
      maxWidthRatio: 0.42,
      maxBottomRatio: 0.5,
      align: "left",
      color: NAVY,
      fontSize: 42,
    },
    tagline: {
      placement: "slot",
      align: "left",
      color: SLATE,
      fontSize: 38,
      fontWeight: 700,
      lineHeight: 44,
      xRatio: 0.54,
      yRatio: 0.54,
      maxWidthRatio: 0.42,
      maxBottomRatio: 0.7,
    },
  },
};
