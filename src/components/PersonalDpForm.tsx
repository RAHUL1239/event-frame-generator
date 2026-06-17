"use client";

import { useRef, useState } from "react";
import { usePhotoCrop } from "@/components/PhotoCropEditor";
import { PhotoFramePreview } from "@/components/PhotoFramePreview";
import { AttendeeSocialProof } from "@/components/AttendeeSocialProof";
import {
  FrameThemePicker,
  getGenerateFrameLabel,
} from "@/components/FrameThemePicker";
import type { EventWithOptions } from "@/lib/types";
import {
  parseEnabledFrameThemes,
  type FrameThemeKey,
} from "@/lib/frame-themes";
import { generatePersonalAssets } from "@/lib/image-generator";
import { savePreviewAssets } from "@/lib/preview-storage";
import { useRouter } from "next/navigation";

type Props = {
  event: EventWithOptions;
  slug: string;
  attendeeCount: number;
};

export function PersonalDpForm({ event, slug, attendeeCount }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [genderKey, setGenderKey] = useState(
    event.genderOptions[0]?.key ?? ""
  );
  const [city, setCity] = useState("");
  const [role, setRole] = useState("Attendee");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { crop: photoCrop, setCrop: setPhotoCrop } = usePhotoCrop(photoPreview);
  const enabledThemes = parseEnabledFrameThemes(event.enabledFrameThemes);
  const hasThemeStep = enabledThemes.length > 0;
  const [frameThemeKey, setFrameThemeKey] = useState<FrameThemeKey | "">(
    enabledThemes[0] ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handlePhotoChange(file: File | null) {
    setPhoto(file);
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!firstName.trim()) return setError("First name is required");
    if (!lastName.trim()) return setError("Last name is required");
    if (!genderKey) return setError("Please select a tagline option");
    if (!photo) return setError("Please upload your photo");
    if (hasThemeStep && !frameThemeKey) {
      return setError("Please select a frame style");
    }

    setLoading(true);
    try {
      const assets = await generatePersonalAssets({
        event,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        genderKey,
        city: city.trim() || event.location || "",
        role: role.trim(),
        photo,
        photoCrop,
        frameThemeKey: frameThemeKey || undefined,
      });

      const formData = new FormData();
      formData.append("type", "personal");
      formData.append("firstName", firstName.trim());
      formData.append("lastName", lastName.trim());
      formData.append("genderKey", genderKey);
      if (frameThemeKey) formData.append("frameThemeKey", frameThemeKey);
      formData.append("city", city.trim() || event.location || "");
      formData.append("role", role.trim());
      formData.append(
        "fileMeta",
        JSON.stringify({
          originalName: photo.name,
          mimeType: photo.type,
          sizeBytes: photo.size,
        })
      );

      const res = await fetch(`/api/events/${slug}/submissions`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to save submission");
      const data = await res.json();
      savePreviewAssets(data.id, assets);
      router.push(`/events/${slug}/preview/${data.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
      <div className="rounded-2xl bg-white p-6 shadow-lg md:p-10">
        <span
          className="inline-block rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide"
          style={{
            backgroundColor: `${event.accentColor}22`,
            color: event.primaryColor,
          }}
        >
          Create your frame
        </span>

        <h2
          className="mt-4 text-3xl font-bold"
          style={{ color: event.primaryColor }}
        >
          Enter Your Details
        </h2>
        <p className="mt-2 text-gray-600">
          Fill in your info, upload your photo, and choose a frame style.
        </p>

        <div className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                First Name *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-brand-cream px-4 py-3 outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Last Name *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-brand-cream px-4 py-3 outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Tagline Gender *
            </label>
            <div className="grid gap-3 md:grid-cols-3">
              {event.genderOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setGenderKey(option.key)}
                  className={`rounded-xl border-2 px-4 py-3 text-left text-sm transition ${
                    genderKey === option.key
                      ? "border-brand-teal bg-white shadow-sm"
                      : "border-transparent bg-brand-cream text-gray-700 hover:bg-brand-cream-dark"
                  }`}
                  style={
                    genderKey === option.key
                      ? { borderColor: event.primaryColor }
                      : undefined
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Your Photo *
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
            />
            {!photoPreview ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-brand-cream px-6 py-10 transition hover:border-brand-teal"
              >
                <span className="mb-2 text-3xl text-gray-400">↑</span>
                <span className="font-medium text-gray-700">
                  Click to upload photo
                </span>
                <span className="mt-1 text-sm text-gray-500">
                  JPG, PNG · Best with clear face
                </span>
              </button>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-300 bg-brand-cream p-4">
                <PhotoFramePreview
                  event={event}
                  frameThemeKey={frameThemeKey || undefined}
                  firstName={firstName}
                  lastName={lastName}
                  genderKey={genderKey}
                  city={city}
                  role={role}
                  src={photoPreview}
                  crop={photoCrop}
                  onCropChange={setPhotoCrop}
                />
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-200 pt-3">
                  <span className="truncate text-sm text-gray-600">
                    {photo?.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="shrink-0 text-sm font-medium underline"
                    style={{ color: event.primaryColor }}
                  >
                    Change photo
                  </button>
                </div>
              </div>
            )}
          </div>

          {hasThemeStep ? (
            <FrameThemePicker
              enabledFrameThemes={event.enabledFrameThemes}
              value={frameThemeKey}
              onChange={setFrameThemeKey}
              primaryColor={event.primaryColor}
            />
          ) : null}

          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: `${event.accentColor}22` }}
          >
            <span className="mr-2">⚠️</span>
            <strong>Disclaimer:</strong> Your photo is processed temporarily and
            automatically deleted from our servers once the frame is generated. We
            do not retain any uploaded images.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                City <span className="font-normal normal-case text-gray-400">(suggested)</span>
              </label>
              <input
                type="text"
                name="frameCity"
                id="frame-city"
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={event.location ?? "e.g. Washington DC"}
                className="input-suggested w-full rounded-xl border border-gray-200 bg-brand-cream px-4 py-3 outline-none focus:border-brand-teal"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Role / Designation
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Attendee"
                className="w-full rounded-xl border border-gray-200 bg-brand-cream px-4 py-3 outline-none focus:border-brand-teal"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-4 text-lg font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{
              backgroundColor: event.primaryColor,
              color: event.accentColor,
            }}
          >
            {getGenerateFrameLabel(loading)}
          </button>
        </div>
      </div>

      <AttendeeSocialProof
        count={attendeeCount}
        primaryColor={event.primaryColor}
      />
    </form>
  );
}
