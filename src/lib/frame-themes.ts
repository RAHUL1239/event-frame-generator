export const FRAME_THEME_KEYS = [
  "traditional-maharashtrian",
  "elegant-gold",
  "youth",
  "family",
  "volunteer",
  "sponsor",
] as const;

export type FrameThemeKey = (typeof FRAME_THEME_KEYS)[number];

export type FrameBorderStyle =
  | "classic"
  | "ornate"
  | "minimal"
  | "bold"
  | "double"
  | "premium";

export type FrameThemeColors = {
  primary: string;
  accent: string;
  background: string;
  gold: string;
  green: string;
};

export type FrameThemeDefinition = {
  key: FrameThemeKey;
  name: string;
  description: string;
  colors: FrameThemeColors;
  borderStyle: FrameBorderStyle;
  photoRingWidth: number;
};

export const FRAME_THEMES: Record<FrameThemeKey, FrameThemeDefinition> = {
  "traditional-maharashtrian": {
    key: "traditional-maharashtrian",
    name: "Traditional Maharashtrian",
    description: "Maroon and gold with classic ornamental borders",
    colors: {
      primary: "#7B1E3A",
      accent: "#D4AF37",
      background: "#f5f0e8",
      gold: "#D4AF37",
      green: "#2D6A4F",
    },
    borderStyle: "ornate",
    photoRingWidth: 10,
  },
  "elegant-gold": {
    key: "elegant-gold",
    name: "Elegant Gold",
    description: "Navy and gold with a refined, minimal frame",
    colors: {
      primary: "#1E3A6E",
      accent: "#C9A227",
      background: "#f5f0e8",
      gold: "#C9A227",
      green: "#2D8A4E",
    },
    borderStyle: "minimal",
    photoRingWidth: 6,
  },
  youth: {
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
  },
  family: {
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
  },
  volunteer: {
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
    photoRingWidth: 8,
  },
  sponsor: {
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
    photoRingWidth: 7,
  },
};

export const FRAME_THEME_LIST = FRAME_THEME_KEYS.map((key) => FRAME_THEMES[key]);

export type ResolvedFrameTheme = {
  key: FrameThemeKey | null;
  name: string;
  colors: FrameThemeColors;
  borderStyle: FrameBorderStyle;
  photoRingWidth: number;
};

export function isFrameThemeKey(value: string): value is FrameThemeKey {
  return FRAME_THEME_KEYS.includes(value as FrameThemeKey);
}

export function parseEnabledFrameThemes(
  raw: string | null | undefined
): FrameThemeKey[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const unique = parsed.filter(
      (key): key is FrameThemeKey =>
        typeof key === "string" && isFrameThemeKey(key)
    );
    return [...new Set(unique)].slice(0, 3);
  } catch {
    return [];
  }
}

export function normalizeEnabledFrameThemes(input: unknown): FrameThemeKey[] {
  if (!Array.isArray(input)) return [];
  const unique = input.filter(
    (key): key is FrameThemeKey => typeof key === "string" && isFrameThemeKey(key)
  );
  return [...new Set(unique)].slice(0, 3);
}

export function serializeEnabledFrameThemes(themes: FrameThemeKey[]): string {
  return JSON.stringify(normalizeEnabledFrameThemes(themes));
}

export function serializeEnabledFrameThemesOrNull(
  input: unknown
): string | null {
  const normalized = normalizeEnabledFrameThemes(input);
  return normalized.length > 0 ? serializeEnabledFrameThemes(normalized) : null;
}

export function resolveFrameTheme(
  event: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    enabledFrameThemes?: string | null;
  },
  selectedKey?: string | null
): ResolvedFrameTheme {
  const enabled = parseEnabledFrameThemes(event.enabledFrameThemes);

  if (enabled.length === 0) {
    return {
      key: null,
      name: "Event default",
      colors: {
        primary: event.primaryColor,
        accent: event.accentColor,
        background: event.backgroundColor,
        gold: "#D4AF37",
        green: "#2D8A4E",
      },
      borderStyle: "minimal",
      photoRingWidth: 8,
    };
  }

  const key =
    selectedKey && isFrameThemeKey(selectedKey) && enabled.includes(selectedKey)
      ? selectedKey
      : enabled[0];
  const theme = FRAME_THEMES[key];

  return {
    key,
    name: theme.name,
    colors: theme.colors,
    borderStyle: theme.borderStyle,
    photoRingWidth: theme.photoRingWidth,
  };
}

export function drawFrameThemeDecoration(
  ctx: CanvasRenderingContext2D,
  theme: ResolvedFrameTheme,
  width: number,
  height: number
) {
  const { primary, accent } = theme.colors;
  const inset = 18;

  switch (theme.borderStyle) {
    case "ornate": {
      ctx.strokeStyle = primary;
      ctx.lineWidth = 5;
      ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(inset + 10, inset + 10, width - (inset + 10) * 2, height - (inset + 10) * 2);
      break;
    }
    case "bold": {
      ctx.strokeStyle = primary;
      ctx.lineWidth = 14;
      ctx.strokeRect(8, 8, width - 16, height - 16);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      ctx.strokeRect(22, 22, width - 44, height - 44);
      break;
    }
    case "double": {
      ctx.strokeStyle = primary;
      ctx.lineWidth = 4;
      ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(inset + 8, inset + 8, width - (inset + 8) * 2, height - (inset + 8) * 2);
      break;
    }
    case "premium": {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
      ctx.strokeStyle = primary;
      ctx.lineWidth = 1;
      ctx.strokeRect(inset + 6, inset + 6, width - (inset + 6) * 2, height - (inset + 6) * 2);
      break;
    }
    case "classic": {
      const corner = 48;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      [
        [inset, inset + corner, inset, inset, inset + corner, inset],
        [width - inset - corner, inset, width - inset, inset, width - inset, inset + corner],
        [inset, height - inset - corner, inset, height - inset, inset + corner, height - inset],
        [
          width - inset - corner,
          height - inset,
          width - inset,
          height - inset,
          width - inset,
          height - inset - corner,
        ],
      ].forEach((segment) => {
        ctx.beginPath();
        ctx.moveTo(segment[0], segment[1]);
        ctx.lineTo(segment[2], segment[3]);
        ctx.lineTo(segment[4], segment[5]);
        ctx.stroke();
      });
      break;
    }
    case "minimal":
    default: {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
      break;
    }
  }
}
