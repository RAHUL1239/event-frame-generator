import { posterType } from "./typography";
import type { PosterFrame } from "./types";

const MAROON = "#5C1020";
const GOLD = "#D4AF37";
const NAVY = "#1A2B56";
const ORANGE = "#E85D33";
const TEAL = "#1B827E";

/**
 * Ornate maroon frame image with the Gauravshali content layout,
 * white name, and no photo ring.
 */
export const traditionalMaharashtrianFrame: PosterFrame = {
  key: "traditional-maharashtrian",
  name: "Traditional Maharashtrian",
  description: "Maroon and gold frame with the Gauravshali Sohla poster layout",
  colors: {
    primary: MAROON,
    accent: GOLD,
    background: "#f5f0e8",
    gold: GOLD,
    green: "#2D6A4F",
  },
  borderStyle: "ornate",
  photoRingWidth: 10,
  overlayKey: "traditional-maharashtrian",
  posterTextColor: NAVY,
  overlay: {
    src: "/frames/maharashtrian-frame.jpg",
    holeInsetRatio: 62 / 1080,
    contentPadding: 50,
  },
  paint: {
    layout: "gs-framed",
    background: "solid-primary",
    paintOverlay: true,
    photoRing: "none",
    fullBleedLayout: false,
    photoWarmAccent: false,
    besidePhotoScale: 1.06,
    includeEventTagline: true,
    posterTextColor: NAVY,
    nameColor: "#ffffff",
    nameLift: 10,
    logoSize: 124,
    dividerStroke: "rgba(26, 43, 86, 0.28)",
    headlineColors: "token-or-white",
    attribution: {
      text: "Generated using https://www.RSVPshare.com",
      raise: 60,
      bottomInset: 8,
      useOverlayInset: true,
    },
    type: posterType(),
    gsHeader: {
      fullBleed: false,
      logoMatte: false,
      logoSize: 124,
      eventNameColor: ORANGE,
      eventNameSize: 24,
      eventNameLine: 21,
      dateColor: ORANGE,
      dateSize: 24,
      hashtagColor: TEAL,
      hashtagSize: 37,
      taglineColor: ORANGE,
      taglineSize: 30,
      taglineLine: 36,
    },
    gsFooter: {
      barBounds: "inset-50",
      sideInset: 50,
      venueBarColor: TEAL,
      venueTextColor: "#ffffff",
      barColor: TEAL,
      sectionGap: 0,
      contentBottom: "framed",
      iconColor: NAVY,
      socialHandleColor: GOLD,
    },
  },
};
