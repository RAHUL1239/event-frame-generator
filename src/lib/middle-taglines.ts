export const MIDDLE_TAGLINE_COUNT = 3;

export function parseMiddleTaglines(raw: string | null | undefined): string[] {
  if (!raw) {
    return Array.from({ length: MIDDLE_TAGLINE_COUNT }, () => "");
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return Array.from({ length: MIDDLE_TAGLINE_COUNT }, () => "");
    }
    return Array.from({ length: MIDDLE_TAGLINE_COUNT }, (_, i) =>
      String(parsed[i] ?? "").trim()
    );
  } catch {
    return Array.from({ length: MIDDLE_TAGLINE_COUNT }, () => "");
  }
}

export function serializeMiddleTaglines(taglines: string[]): string | null {
  const normalized = Array.from({ length: MIDDLE_TAGLINE_COUNT }, (_, i) =>
    String(taglines[i] ?? "").trim()
  );
  return normalized.some(Boolean) ? JSON.stringify(normalized) : null;
}

export function normalizeMiddleTaglines(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return Array.from({ length: MIDDLE_TAGLINE_COUNT }, () => "");
  }
  return Array.from({ length: MIDDLE_TAGLINE_COUNT }, (_, i) =>
    String(input[i] ?? "").trim()
  );
}
