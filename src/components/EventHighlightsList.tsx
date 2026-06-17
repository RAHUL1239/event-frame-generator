import { parseEventHighlights } from "@/lib/event-highlights";

type Props = {
  highlights: string | null | undefined;
  primaryColor: string;
  accentColor: string;
  className?: string;
};

export function EventHighlightsList({
  highlights,
  primaryColor,
  accentColor,
  className = "",
}: Props) {
  const items = parseEventHighlights(highlights);
  if (items.length === 0) return null;

  return (
    <ul className={`space-y-2 text-sm text-gray-700 ${className}`}>
      {items.map((item, index) => (
        <li key={`${index}-${item}`} className="flex items-start gap-2">
          <span
            className="mt-0.5 shrink-0 font-bold"
            style={{ color: accentColor }}
            aria-hidden
          >
            ✓
          </span>
          <span style={{ color: primaryColor }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}
