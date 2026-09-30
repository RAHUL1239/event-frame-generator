import { POSTER_FONT_FAMILY } from "../poster-fonts";
import type { FrameTypography } from "./types";

/** Sizes the current posters already use. A new frame overrides only what changes. */
export const SHARED_POSTER_TYPE: FrameTypography = {
  fontFamily: POSTER_FONT_FAMILY,
  headlineSize: 38,
  headlineLine: 44,
  personalNameSize: 46,
  personalTaglineSize: 24,
  headerNameSize: 40,
  headerNameLine: 36,
  headerVenueSize: 22,
  headerHashtagSize: 18,
  attributionSize: 20,
};

export function posterType(
  overrides: Partial<FrameTypography> = {}
): FrameTypography {
  return { ...SHARED_POSTER_TYPE, ...overrides };
}

export const DEFAULT_ATTRIBUTION = {
  text: "https://www.RSVPshare.com",
  raise: 0,
  bottomInset: 8,
  useOverlayInset: false,
} as const;
