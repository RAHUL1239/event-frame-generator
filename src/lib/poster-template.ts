import type { EventWithOptions } from "./types";
import {
  MKM_DEFAULT_POSTER_TEMPLATE,
  MKM_EVENT_SLUG,
  mergePosterTemplate,
} from "./mkm-poster-template";

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
  ticketUrl?: string;
  /** Full-width venue line shown in the light bar above stats (GS layout). */
  venueLine?: string;
};

export function parsePosterTemplate(event: EventWithOptions): PosterTemplateConfig {
  let parsed: PosterTemplateConfig = {};

  if (event.posterTemplate) {
    try {
      parsed = JSON.parse(event.posterTemplate) as PosterTemplateConfig;
    } catch {
      parsed = {};
    }
  }

  if (event.slug === MKM_EVENT_SLUG) {
    return mergePosterTemplate(MKM_DEFAULT_POSTER_TEMPLATE, parsed);
  }

  return parsed;
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

/** Text colors for posters rendered on a dark (primary) background. */
export function resolvePosterTextColor(
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
      return "#ffffff";
  }
}

export function getPosterHeadline(
  config: PosterTemplateConfig,
  event: EventWithOptions,
  _genderTagline?: string
): PosterHeadlineLine[] {
  if (config.headline?.length) {
    return config.headline.filter((line) => line.text.trim().length > 0);
  }

  return [];
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

export function getPosterTicketUrl(config: PosterTemplateConfig): string | undefined {
  const url = config.ticketUrl?.trim();
  return url || undefined;
}

export function formatPosterTicketLabel(ticketUrl: string): string {
  const display = ticketUrl.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  return `Book Tickets — ${display}`;
}

export function getPosterVenueBarLine(
  config: PosterTemplateConfig,
  event: EventWithOptions,
  highlights: string[] = []
): string | undefined {
  const explicit = config.venueLine?.trim();
  if (explicit) return explicit;

  const venueHighlight = highlights.find((h) =>
    /droumavalla|farm|leesburg/i.test(h)
  );
  if (venueHighlight) {
    return venueHighlight.replace(/\n/g, ", ").trim();
  }

  const loc = event.location?.trim();
  return loc ? loc : undefined;
}
