"use client";

import {
  MIDDLE_TAGLINE_COUNT,
  parseMiddleTaglines,
  serializeMiddleTaglines,
} from "@/lib/middle-taglines";

type Props = {
  value: string | null;
  onChange: (serialized: string | null) => void;
};

export function MiddleTaglinesAdmin({ value, onChange }: Props) {
  const taglines = parseMiddleTaglines(value);

  function updateTagline(index: number, text: string) {
    const next = [...taglines];
    next[index] = text;
    onChange(serializeMiddleTaglines(next));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Shown in the poster middle section next to the attendee or group name.
      </p>
      {Array.from({ length: MIDDLE_TAGLINE_COUNT }, (_, i) => (
        <div key={i}>
          <label className="text-xs font-medium text-gray-500">
            Middle tagline {i + 1}
          </label>
          <input
            value={taglines[i] ?? ""}
            onChange={(e) => updateTagline(i, e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            placeholder={`Tagline ${i + 1}`}
          />
        </div>
      ))}
    </div>
  );
}
