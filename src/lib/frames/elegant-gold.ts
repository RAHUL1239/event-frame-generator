import { defineClassicFrame } from "./classic";

export const elegantGoldFrame = defineClassicFrame({
  key: "elegant-gold",
  name: "Elegant Gold",
  description: "Navy and gold with an ornate artisan frame",
  colors: {
    primary: "#1E3A6E",
    accent: "#C9A227",
    background: "#f5f0e8",
    gold: "#C9A227",
    green: "#2D8A4E",
  },
  borderStyle: "minimal",
  photoRingWidth: 6,
  overlayKey: "elegant-gold",
  overlay: {
    src: "/frames/elegant-gold-frame.jpg?v=2",
    holeInsetRatio: 72 / 1080,
    contentPadding: 50,
  },
  tagline: {
    fontSize: 30,
    fontWeight: 700,
    lineHeight: 50,
    afterNameGap: 84,
    stackBelowName: true,
    color: "#ffffff",
  },
});
