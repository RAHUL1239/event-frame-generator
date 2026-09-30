import { defineClassicFrame } from "./classic";

export const sponsorFrame = defineClassicFrame({
  key: "sponsor",
  name: "Sponsor Theme",
  description: "Charcoal and gold for a premium sponsor look",
  colors: {
    primary: "#2C3E50",
    accent: "#D4AF37",
    background: "#f5f0e8",
    gold: "#D4AF37",
    green: "#27AE60",
  },
  borderStyle: "premium",
  photoRingWidth: 6,
  roleBadge: {
    text: "I am a sponsor",
    background: "#D4AF37",
    color: "#1A242F",
  },
});
