import { registerFrameOverlay } from "../frame-overlays";
import { elegantGoldFrame } from "./elegant-gold";
import { familyFrame } from "./family";
import { gauravshaliSohlaFrame } from "./gauravshali-sohla";
import { oneWorldFrame } from "./one-world";
import { sponsorFrame } from "./sponsor";
import { traditionalMaharashtrianFrame } from "./traditional-maharashtrian";
import { volunteerFrame } from "./volunteer";
import { youthFrame } from "./youth";
import type { PosterFrame } from "./types";

/**
 * Add a frame by creating a module next to these files and appending it here.
 * Give it a new key in FRAME_THEME_KEYS, then enable it per event in admin.
 * Copy gauravshali-sohla.ts or traditional-maharashtrian.ts for a unique
 * layout, or use defineClassicFrame when only colors, type, and border change.
 */
export const POSTER_FRAMES: PosterFrame[] = [
  traditionalMaharashtrianFrame,
  elegantGoldFrame,
  gauravshaliSohlaFrame,
  youthFrame,
  familyFrame,
  volunteerFrame,
  sponsorFrame,
  oneWorldFrame,
];

for (const frame of POSTER_FRAMES) {
  if (frame.overlay && frame.overlayKey) {
    registerFrameOverlay(frame.overlayKey, frame.overlay);
  }
}
