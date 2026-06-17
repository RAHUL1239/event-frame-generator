"use client";

import { FrameThemePreview } from "@/components/FrameThemePreview";
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
  eventName?: string;
};

export function FrameThemePicker({
  enabledFrameThemes,
  value,
  onChange,
  primaryColor,
  eventName,
}: Props) {
  const enabled = parseEnabledFrameThemes(enabledFrameThemes);
  if (enabled.length === 0) return null;

  const selectedTheme = value ? FRAME_THEMES[value] : null;

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        Frame style *
      </label>
      <p className="mb-3 text-sm text-gray-600">
        Choose a look for your poster and WhatsApp DP. Tap a style to preview it.
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
              className={`overflow-hidden rounded-xl border-2 text-left transition ${
                selected
                  ? "border-brand-teal bg-white shadow-md"
                  : "border-transparent bg-brand-cream hover:bg-brand-cream-dark"
              }`}
              style={selected ? { borderColor: primaryColor } : undefined}
            >
              <FrameThemePreview
                theme={theme}
                eventName={eventName}
                compact
              />
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-900">
                  {theme.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {theme.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {selectedTheme && (
        <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-center text-sm font-semibold text-gray-700">
            Selected: {selectedTheme.name}
          </p>
          <FrameThemePreview
            theme={selectedTheme}
            eventName={eventName}
          />
          <p className="mt-3 text-center text-xs text-gray-500">
            Your photo and details will appear in this layout when generated.
          </p>
        </div>
      )}
    </div>
  );
}
