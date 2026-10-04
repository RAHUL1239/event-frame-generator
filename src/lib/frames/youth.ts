import { defineClassicFrame } from "./classic";

export const youthFrame = defineClassicFrame({
  key: "youth",
  name: "Youth Theme",
  description: "Bold purple and orange for a vibrant look",
  colors: {
    primary: "#870A82",
    accent: "#E85D24",
    background: "#f5f0e8",
    gold: "#F4B400",
    green: "#00A86B",
  },
  borderStyle: "bold",
  photoRingWidth: 12,
  tagline: {
    fontSize: 34,
    fontWeight: 700,
    lineHeight: 40,
    afterNameGap: 22,
    color: "#ffffff",
  },
});
