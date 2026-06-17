import type { EventWithOptions } from "./types";

export const POSTER_GOLD = "#d4af37";
export const POSTER_GREEN = "#2d8a4e";

export type PosterHeadlineLine = {
  text: string;
  color?: "primary" | "accent" | "gold" | "green";
};

export type PosterStat = {
  value: string;
  label: string;
  color?: "primary" | "accent" | "gold" | "green";
};

export type PosterTemplateConfig = {
  hashtag?: string;
  headline?: PosterHeadlineLine[];
  stats?: PosterStat[];
  website?: string;
  socialHandle?: string;
  qrUrl?: string;
};

export function parsePosterTemplate(event: EventWithOptions): PosterTemplateConfig {
  if (!event.posterTemplate) return {};

  try {
    return JSON.parse(event.posterTemplate) as PosterTemplateConfig;
  } catch {
    return {};
  }
}

export function resolvePosterColor(
  token: string | undefined,
  primary: string,
  accent: string,
  gold = POSTER_GOLD,
  green = POSTER_GREEN
): string {
  switch (token) {
    case "accent":
      return accent;
    case "gold":
      return gold;
    case "green":
      return green;
    case "primary":
    default:
      return primary;
  }
}

export function getPosterHeadline(
  config: PosterTemplateConfig,
  event: EventWithOptions,
  genderTagline: string
): PosterHeadlineLine[] {
  if (config.headline?.length) return config.headline;

  const lines: PosterHeadlineLine[] = [
    { text: "JOIN ME AT THE", color: "accent" },
  ];

  const eventWords = event.name.toUpperCase().split(/\s+/).filter(Boolean);
  if (eventWords.length >= 3) {
    lines.push({ text: eventWords[0], color: "primary" });
    lines.push({ text: eventWords.slice(1).join(" "), color: "gold" });
  }

  if (genderTagline.trim()) {
    lines.push({ text: genderTagline, color: "primary" });
  } else if (eventWords.length < 3) {
    lines.push({ text: event.name.toUpperCase(), color: "primary" });
  }

  return lines;
}

export function getPosterHashtag(
  config: PosterTemplateConfig,
  event: EventWithOptions
): string | undefined {
  if (config.hashtag) return config.hashtag;
  if (event.subtitle?.startsWith("#")) return event.subtitle;
  return undefined;
}

export function getPosterVenueLine(event: EventWithOptions): string {
  const date = event.dateLabel.toUpperCase();
  const venue = event.location?.trim();
  return venue ? `${date} • ${venue.toUpperCase()}` : date;
}
