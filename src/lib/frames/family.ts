import { defineClassicFrame } from "./classic";

export const familyFrame = defineClassicFrame({
  key: "family",
  name: "Family Theme",
  description: "Warm greens and orange for a welcoming feel",
  colors: {
    primary: "#2D5A3D",
    accent: "#E07830",
    background: "#f5f0e8",
    gold: "#D4A574",
    green: "#2D5A3D",
  },
  borderStyle: "classic",
  photoRingWidth: 8,
  tagline: {
    fontSize: 34,
    fontWeight: 700,
    lineHeight: 40,
    afterNameGap: 22,
    color: "#ffffff",
  },
});
