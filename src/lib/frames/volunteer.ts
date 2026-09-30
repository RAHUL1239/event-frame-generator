import { defineClassicFrame } from "./classic";

export const volunteerFrame = defineClassicFrame({
  key: "volunteer",
  name: "Volunteer Theme",
  description: "Teal and coral celebrating community service",
  colors: {
    primary: "#1A4D4A",
    accent: "#E85D24",
    background: "#f5f0e8",
    gold: "#C9A227",
    green: "#1A4D4A",
  },
  borderStyle: "double",
  photoRingWidth: 6,
  roleBadge: {
    text: "I am a volunteer",
    background: "#E85D24",
    color: "#ffffff",
  },
});
