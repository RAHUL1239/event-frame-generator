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
      <ul className="space-y-2">
        {enabled.map((key) => {
          const theme = FRAME_THEMES[key];
          const selected = value === key;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onChange(key)}
                className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition ${
                  selected
                    ? "border-brand-teal bg-white shadow-sm"
                    : "border-transparent bg-brand-cream text-gray-800 hover:bg-brand-cream-dark"
                }`}
                style={selected ? { borderColor: primaryColor } : undefined}
              >
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: selected ? primaryColor : "#d1d5db",
                    backgroundColor: selected ? primaryColor : "transparent",
                  }}
                  aria-hidden
                >
                  {selected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
                {theme.name}
              </button>
            </li>
          );
        })}
      </ul>

      {selectedTheme && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="mb-3 text-center text-xs font-medium text-gray-600">
            Preview — {selectedTheme.name}
          </p>
          <FrameThemePreview theme={selectedTheme} eventName={eventName} />
        </div>
      )}
    </div>
  );
}

export function getGenerateFrameLabel(loading: boolean): string {
  if (loading) return "Generating...";
  return "✨ Generate my frame";
}
