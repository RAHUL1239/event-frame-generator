"use client";

import { useRef, useState } from "react";
import { PhotoCropEditor } from "@/components/PhotoCropEditor";
import type { EventWithOptions } from "@/lib/types";
import { generateGroupAssets } from "@/lib/image-generator";
import {
  DEFAULT_PHOTO_CROP,
  getSmartDefaultCrop,
  type PhotoCrop,
} from "@/lib/photo-crop";
import { loadImage } from "@/lib/utils";
import { savePreviewAssets } from "@/lib/preview-storage";
import { useRouter } from "next/navigation";

type Props = {
  event: EventWithOptions;
  slug: string;
};

export function GroupDpForm({ event, slug }: Props) {
  const router = useRouter();
  const [memberCount, setMemberCount] = useState<2 | 3 | 4>(2);
  const [groupName, setGroupName] = useState("");
  const [city, setCity] = useState("");
  const [photos, setPhotos] = useState<(File | null)[]>([null, null, null, null]);
  const [previews, setPreviews] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [photoCrops, setPhotoCrops] = useState<PhotoCrop[]>([
    DEFAULT_PHOTO_CROP,
    DEFAULT_PHOTO_CROP,
    DEFAULT_PHOTO_CROP,
    DEFAULT_PHOTO_CROP,
  ]);
  const fileRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePhotoChange(index: number, file: File | null) {
    const nextPhotos = [...photos];
    const nextPreviews = [...previews];
    const nextCrops = [...photoCrops];
    nextPhotos[index] = file;
    if (file) {
      const url = URL.createObjectURL(file);
      nextPreviews[index] = url;
      try {
        const img = await loadImage(url);
        nextCrops[index] = getSmartDefaultCrop(img.width, img.height);
      } catch {
        nextCrops[index] = DEFAULT_PHOTO_CROP;
      }
    } else {
      nextPreviews[index] = null;
      nextCrops[index] = DEFAULT_PHOTO_CROP;
    }

    setPhotos(nextPhotos);
    setPreviews(nextPreviews);
    setPhotoCrops(nextCrops);
  }

  function updateCrop(index: number, crop: PhotoCrop) {
    const nextCrops = [...photoCrops];
    nextCrops[index] = crop;
    setPhotoCrops(nextCrops);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!groupName.trim()) return setError("Group name is required");

    const activePhotos = photos.slice(0, memberCount);
    if (activePhotos.some((p) => !p)) {
      return setError("Please upload a photo for each member");
    }

    setLoading(true);
    try {
      const assets = await generateGroupAssets({
        event,
        groupName: groupName.trim(),
        city: city.trim() || event.location || "",
        memberCount,
        photos: activePhotos as File[],
        members: Array.from({ length: memberCount }, (_, i) => ({
          name: `Member ${i + 1}`,
        })),
        photoCrops: photoCrops.slice(0, memberCount),
      });

      const formData = new FormData();
      formData.append("type", "group");
      formData.append("groupName", groupName.trim());
      formData.append("city", city.trim() || event.location || "");
      formData.append("memberCount", String(memberCount));
      formData.append("members", JSON.stringify([]));
      formData.append(
        "fileMeta",
        JSON.stringify(
          activePhotos.map((photo, i) => ({
            originalName: photo!.name,
            mimeType: photo!.type,
            sizeBytes: photo!.size,
            memberIndex: i,
          }))
        )
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
          style={{ backgroundColor: `${event.accentColor}22`, color: event.primaryColor }}
        >
          Group DP Generator
        </span>

        <h2
          className="mt-4 text-3xl font-bold"
          style={{ color: event.primaryColor }}
        >
          Enter Group Details
        </h2>
        <p className="mt-2 text-gray-600">
          Create a custom circular collage DP for your family, group, or local
          Mandal.
        </p>

        <div className="mt-8 space-y-6">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Group Size
            </label>
            <div className="inline-flex rounded-xl bg-brand-cream p-1">
              {([2, 3, 4] as const).map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setMemberCount(count)}
                  className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                    memberCount === count
                      ? "bg-white shadow text-brand-teal"
                      : "text-gray-600"
                  }`}
                >
                  {count} Members
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Member Photos *
            </label>
            <div
              className={`grid gap-4 ${
                memberCount === 2
                  ? "grid-cols-2"
                  : memberCount === 3
                    ? "grid-cols-3"
                    : "grid-cols-2 md:grid-cols-4"
              }`}
            >
              {Array.from({ length: memberCount }).map((_, i) => (
                <div key={i}>
                  <input
                    ref={fileRefs[i]}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) =>
                      handlePhotoChange(i, e.target.files?.[0] ?? null)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => fileRefs[i].current?.click()}
                    className="flex aspect-square w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-brand-cream p-3 transition hover:border-brand-teal"
                  >
                    {previews[i] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previews[i]!}
                        alt={`Member ${i + 1}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <>
                        <span className="text-2xl text-gray-400">↑</span>
                        <span className="mt-2 text-xs text-gray-500">
                          Member {i + 1}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
            {Array.from({ length: memberCount }).map(
              (_, i) =>
                previews[i] && (
                  <div
                    key={`crop-${i}`}
                    className="mt-4 rounded-xl border border-gray-200 bg-brand-cream p-4"
                  >
                    <PhotoCropEditor
                      src={previews[i]!}
                      crop={photoCrops[i]}
                      onCropChange={(crop) => updateCrop(i, crop)}
                      accentColor={event.accentColor}
                      label={`Adjust Member ${i + 1}`}
                    />
                  </div>
                )
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Seattle Swaravahini"
              className="w-full rounded-xl border border-gray-200 bg-brand-cream px-4 py-3 outline-none focus:border-brand-teal"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              City <span className="font-normal normal-case text-gray-400">(suggested)</span>
            </label>
            <input
              type="text"
              name="event-city"
              autoComplete="off"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={event.location ?? "e.g. Washington DC"}
              className="w-full rounded-xl border border-gray-200 bg-brand-cream px-4 py-3 text-gray-500 placeholder:text-gray-400 outline-none focus:border-brand-teal"
            />
          </div>

          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: `${event.accentColor}22` }}
          >
            <span className="mr-2">⚠️</span>
            <strong>Disclaimer:</strong> Photos are processed temporarily and not
            retained on the server.
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
            style={{ backgroundColor: event.primaryColor, color: event.accentColor }}
          >
            {loading ? "Generating..." : "✨ Generate Group DP"}
          </button>
        </div>
      </div>
    </form>
  );
}
