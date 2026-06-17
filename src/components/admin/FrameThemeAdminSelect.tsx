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
      <div className="grid gap-3 sm:grid-cols-2">
        {FRAME_THEME_LIST.map((theme) => {
          const checked = selected.includes(theme.key);
          const disabled = !checked && selected.length >= 3;
          return (
            <label
              key={theme.key}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                checked
                  ? "border-brand-teal bg-teal-50/50"
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
                className="mt-1"
              />
              <FrameThemeThumbnail themeKey={theme.key} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-gray-900">
                  {theme.name}
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  {theme.description}
                </span>
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
