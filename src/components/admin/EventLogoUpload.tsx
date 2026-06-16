"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { DEFAULT_EVENT_LOGO } from "@/lib/utils";

type Props = {
  eventId: string;
  logoUrl: string | null;
  onUploaded: (logoUrl: string) => void;
};

export function EventLogoUpload({ eventId, logoUrl, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const displayUrl = preview || logoUrl || DEFAULT_EVENT_LOGO;

  async function handleFileChange(file: File | null) {
    if (!file) return;

    setError("");
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch(`/api/admin/events/${eventId}/logo`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        setPreview(null);
        return;
      }

      onUploaded(data.logoUrl);
      setPreview(null);
    } catch {
      setError("Upload failed");
      setPreview(null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border bg-gray-50 p-2">
        <Image
          src={displayUrl}
          alt="Event logo"
          width={80}
          height={80}
          className="max-h-20 max-w-20 object-contain"
          unoptimized
        />
      </div>

      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">Event logo</p>
        <p className="mt-1 text-xs text-gray-500">
          PNG, JPEG, or WebP. Max 2 MB. Shown on frames and the public header.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-brand-teal px-4 py-2 text-sm font-medium text-brand-teal transition hover:bg-brand-teal/5 disabled:opacity-60"
          >
            {uploading ? "Uploading..." : logoUrl ? "Replace logo" : "Upload logo"}
          </button>
          {logoUrl && (
            <span className="text-xs text-gray-400">{logoUrl}</span>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
}
