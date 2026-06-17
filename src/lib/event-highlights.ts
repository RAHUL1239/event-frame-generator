const MAX_EVENT_HIGHLIGHTS = 8;

export function parseEventHighlights(
  raw: string | null | undefined
): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, MAX_EVENT_HIGHLIGHTS);
  } catch {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, MAX_EVENT_HIGHLIGHTS);
  }
}

export function serializeEventHighlights(highlights: string[]): string | null {
  const normalized = highlights
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_EVENT_HIGHLIGHTS);
  return normalized.length > 0 ? JSON.stringify(normalized) : null;
}

export function normalizeEventHighlights(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, MAX_EVENT_HIGHLIGHTS);
}

export { MAX_EVENT_HIGHLIGHTS };
