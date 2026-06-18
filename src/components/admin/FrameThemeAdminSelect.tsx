"use client";

import {
  FRAME_THEME_LIST,
  normalizeEnabledFrameThemes,
  parseEnabledFrameThemes,
  type FrameThemeKey,
} from "@/lib/frame-themes";
import { FrameThemeThumbnail } from "@/components/admin/FrameThemeThumbnail";

type Props = {
  value: string | null | undefined;
  onChange: (serialized: string) => void;
};

export function FrameThemeAdminSelect({ value, onChange }: Props) {
  const selected = parseEnabledFrameThemes(value);

  function toggleTheme(key: FrameThemeKey) {
    const next = selected.includes(key)
      ? selected.filter((item) => item !== key)
      : normalizeEnabledFrameThemes([...selected, key]);
    onChange(JSON.stringify(next));
  }

  return (
    <div>
      <p className="mb-3 text-sm text-gray-600">
        Choose up to 3 frame styles attendees can pick on the form. Leave all
        unchecked to use the event colors only (no theme picker).
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FRAME_THEME_LIST.map((theme) => {
          const checked = selected.includes(theme.key);
          const disabled = !checked && selected.length >= 3;
          return (
            <label
              key={theme.key}
              className={`relative flex cursor-pointer flex-col items-center rounded-xl border p-4 transition ${
                checked
                  ? "border-brand-teal bg-teal-50/50 ring-2 ring-brand-teal/30"
                  : disabled
                    ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-60"
                    : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggleTheme(theme.key)}
                className="absolute left-3 top-3"
              />
              <FrameThemeThumbnail
                themeKey={theme.key}
                size={128}
                className="h-32 w-32 rounded-lg border border-gray-200 shadow-sm"
              />
              <span className="mt-3 text-center text-sm font-medium text-gray-900">
                {theme.name}
              </span>
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-gray-400">
        {selected.length}/3 selected
      </p>
    </div>
  );
}
