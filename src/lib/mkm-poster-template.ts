import type { PosterTemplateConfig } from "./poster-template";

export const MKM_EVENT_SLUG = "mkm-51st-gauravshali-sohla";

export const MKM_DEFAULT_POSTER_TEMPLATE: PosterTemplateConfig = {
  hashtag: "#MKM51",
  headline: [
    { text: "JOIN US FOR", color: "accent" },
    { text: "गौरवशाली सोहळा", color: "primary" },
    { text: "Celebrating 51 Years of Marathi Kala Mandal", color: "primary" },
  ],
  venueLine: "Droumavalla Farm, Leesburg, VA",
  stats: [
    { value: "51", label: "Years of MKM", color: "accent" },
    { value: "$count", label: "Attendees", color: "primary" },
    { value: "250+", label: "Community Performers", color: "green" },
    { value: "DMV", label: "Marathi Community", color: "gold" },
  ],
  ticketUrl: "https://mkm51.marathi.com/tickets.html",
  qrUrl: "https://mkm51.marathi.com/tickets.html",
  website: "mkm51.marathi.com/tickets",
  socialHandle: "/mkmdc1",
};

export function mergePosterTemplate(
  defaults: PosterTemplateConfig,
  parsed: PosterTemplateConfig
): PosterTemplateConfig {
  return {
    ...defaults,
    ...parsed,
    headline:
      parsed.headline && parsed.headline.length > 0
        ? parsed.headline
        : defaults.headline,
    stats:
      parsed.stats && parsed.stats.length > 0 ? parsed.stats : defaults.stats,
  };
}
