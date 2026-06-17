"use client";

import { useEffect, useState } from "react";
import {
  MAX_EVENT_HIGHLIGHTS,
  parseEventHighlights,
  serializeEventHighlights,
} from "@/lib/event-highlights";

type Props = {
  value: string | null | undefined;
  onChange: (serialized: string | null) => void;
};

function rowsFromValue(value: string | null | undefined): string[] {
  const parsed = parseEventHighlights(value);
  return parsed.length > 0 ? parsed : [""];
}

export function EventHighlightsAdmin({ value, onChange }: Props) {
  const [rows, setRows] = useState<string[]>(() => rowsFromValue(value));

  useEffect(() => {
    setRows(rowsFromValue(value));
  }, [value]);

  function syncToParent(next: string[]) {
    onChange(serializeEventHighlights(next));
  }

  function updateRow(index: number, text: string) {
    const next = [...rows];
    next[index] = text;
    setRows(next);
    syncToParent(next);
  }

  function addRow() {
    if (rows.length >= MAX_EVENT_HIGHLIGHTS) return;
    setRows([...rows, ""]);
  }

  function removeRow(index: number) {
    const next = rows.filter((_, i) => i !== index);
    const normalized = next.length > 0 ? next : [""];
    setRows(normalized);
    syncToParent(normalized);
  }

  return (
    <div>
      <p className="mb-3 text-sm text-gray-600">
        Shown under the generated poster on the preview page (up to{" "}
        {MAX_EVENT_HIGHLIGHTS} items).
      </p>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={row}
              onChange={(e) => updateRow(index, e.target.value)}
              placeholder="e.g. Cultural performances"
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="rounded-lg border px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
              aria-label="Remove highlight"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {rows.length < MAX_EVENT_HIGHLIGHTS && (
        <button
          type="button"
          onClick={addRow}
          className="mt-3 text-sm font-medium text-brand-teal hover:underline"
        >
          + Add highlight
        </button>
      )}
    </div>
  );
}
