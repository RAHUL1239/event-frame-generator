"use client";

import {
  FRAME_THEMES,
  parseEnabledFrameThemes,
  type FrameThemeKey,
} from "@/lib/frame-themes";

type Props = {
  enabledFrameThemes: string | null | undefined;
  value: FrameThemeKey | "";
  onChange: (key: FrameThemeKey) => void;
  primaryColor: string;
};

export function FrameThemePicker({
  enabledFrameThemes,
  value,
  onChange,
  primaryColor,
}: Props) {
  const enabled = parseEnabledFrameThemes(enabledFrameThemes);
  if (enabled.length === 0) return null;

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        Frame style *
      </label>
      <p className="mb-3 text-sm text-gray-600">
        Choose a look for your poster and WhatsApp DP.
      </p>
      <div
        className={`grid gap-3 ${
          enabled.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        {enabled.map((key) => {
          const theme = FRAME_THEMES[key];
          const selected = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`rounded-xl border-2 p-4 text-left transition ${
                selected
                  ? "border-brand-teal bg-white shadow-md"
                  : "border-transparent bg-brand-cream hover:bg-brand-cream-dark"
              }`}
              style={selected ? { borderColor: primaryColor } : undefined}
            >
              <div className="mb-3 flex gap-1">
                <span
                  className="h-6 flex-1 rounded"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <span
                  className="h-6 flex-1 rounded"
                  style={{ backgroundColor: theme.colors.accent }}
                />
                <span
                  className="h-6 flex-1 rounded border border-gray-200"
                  style={{ backgroundColor: theme.colors.background }}
                />
              </div>
              <p className="text-sm font-semibold text-gray-900">{theme.name}</p>
              <p className="mt-1 text-xs text-gray-500">{theme.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
