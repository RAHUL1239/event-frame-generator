"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatFileSize } from "@/lib/utils";
import { EventLogoUpload } from "@/components/admin/EventLogoUpload";

type GenderOption = {
  id: string;
  key: string;
  label: string;
  tagline: string;
  sortOrder: number;
};

type EventDetail = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  tagline: string;
  dateLabel: string;
  location: string | null;
  facebookGroupName: string | null;
  facebookGroupUrl: string | null;
  logoUrl: string | null;
  isActive: boolean;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  posterTemplate: string | null;
  genderOptions: GenderOption[];
  submissions: {
    id: string;
    type: string;
    firstName: string | null;
    lastName: string | null;
    groupName: string | null;
    city: string | null;
    createdAt: string;
    fileUploads: {
      originalName: string;
      storedName: string;
      sizeBytes: number;
      memberIndex: number | null;
    }[];
  }[];
};

type SortOption = "newest" | "firstName" | "lastName";

export default function AdminEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [eventId, setEventId] = useState<string>("");
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loadError, setLoadError] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    params.then(({ id }) => {
      setEventId(id);
      fetch(`/api/admin/events/${id}`)
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) {
            setLoadError(data.error ?? "Failed to load event");
            return;
          }
          setEvent({
            ...data,
            facebookGroupName: data.facebookGroupName ?? null,
            facebookGroupUrl: data.facebookGroupUrl ?? null,
            genderOptions: data.genderOptions ?? [],
            submissions: (data.submissions ?? []).map(
              (sub: EventDetail["submissions"][number]) => ({
                ...sub,
                fileUploads: sub.fileUploads ?? [],
              })
            ),
          });
        })
        .catch(() => setLoadError("Failed to load event"));
    });
  }, [params]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/admin/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: event.name,
        subtitle: event.subtitle,
        tagline: event.tagline,
        dateLabel: event.dateLabel,
        location: event.location,
        facebookGroupName: event.facebookGroupName,
        facebookGroupUrl: event.facebookGroupUrl,
        isActive: event.isActive,
        primaryColor: event.primaryColor,
        accentColor: event.accentColor,
        backgroundColor: event.backgroundColor,
        posterTemplate: event.posterTemplate,
        genderOptions: event.genderOptions,
      }),
    });

    setSaving(false);
    if (res.ok) {
      setMessage("Saved successfully");
      let updated: Partial<EventDetail> | null = null;
      try {
        updated = await res.json();
      } catch {
        setMessage("Saved, but failed to refresh page data. Please reload.");
        return;
      }

      if (!updated?.id) {
        setMessage("Saved, but server returned unexpected data. Please reload.");
        return;
      }

      setEvent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...updated,
          genderOptions: updated.genderOptions ?? prev.genderOptions,
          submissions: (updated.submissions ?? prev.submissions).map((sub) => ({
            ...sub,
            fileUploads: sub.fileUploads ?? [],
          })),
          facebookGroupName: updated.facebookGroupName ?? null,
          facebookGroupUrl: updated.facebookGroupUrl ?? null,
        };
      });
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "Failed to save");
    }
  }

  function updateGender(index: number, field: "label" | "tagline", value: string) {
    if (!event) return;
    const options = [...event.genderOptions];
    options[index] = { ...options[index], [field]: value };
    setEvent({ ...event, genderOptions: options });
  }

  function getSortedSubmissions() {
    if (!event) return [];
    const subs = [...(event.submissions ?? [])];

    if (sortBy === "firstName") {
      return subs.sort((a, b) =>
        (a.firstName ?? "").localeCompare(b.firstName ?? "", undefined, {
          sensitivity: "base",
        })
      );
    }
    if (sortBy === "lastName") {
      return subs.sort((a, b) =>
        (a.lastName ?? "").localeCompare(b.lastName ?? "", undefined, {
          sensitivity: "base",
        })
      );
    }
    return subs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-600">{loadError}</p>
        <Link href="/admin" className="text-brand-teal underline">
          Back to admin
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back
          </Link>
          <h1 className="text-xl font-bold text-brand-teal">{event.name}</h1>
          <a
            href={`/events/${event.slug}/personal`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-sm text-brand-teal underline"
          >
            View public page
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <form onSubmit={handleSave} className="space-y-8">
          <section className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 font-semibold">Logo</h2>
            <EventLogoUpload
              eventId={eventId}
              logoUrl={event.logoUrl}
              onUploaded={(logoUrl) => setEvent({ ...event, logoUrl })}
            />
          </section>

          <section className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 font-semibold">Event Settings</h2>
            <p className="mb-4 text-sm text-gray-500">
              Public URL:{" "}
              <code className="rounded bg-gray-100 px-1">
                /events/{event.slug}/personal
              </code>
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Event Name" value={event.name} onChange={(v) => setEvent({ ...event, name: v })} />
              <Field label="Hashtag" value={event.subtitle} onChange={(v) => setEvent({ ...event, subtitle: v })} hint="e.g. #MKM51 — shown top-right on poster" />
              <Field label="Date Label" value={event.dateLabel} onChange={(v) => setEvent({ ...event, dateLabel: v })} />
              <Field label="Tagline (footer)" value={event.tagline} onChange={(v) => setEvent({ ...event, tagline: v })} />
              <Field label="Location (default city)" value={event.location ?? ""} onChange={(v) => setEvent({ ...event, location: v })} />
              <Field label="Facebook Group Name" value={event.facebookGroupName ?? ""} onChange={(v) => setEvent({ ...event, facebookGroupName: v })} />
              <Field label="Facebook Group URL" value={event.facebookGroupUrl ?? ""} onChange={(v) => setEvent({ ...event, facebookGroupUrl: v })} hint="e.g. https://www.facebook.com/groups/your-group" />
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600">
                  Poster template (JSON)
                </label>
                <textarea
                  value={event.posterTemplate ?? ""}
                  onChange={(e) =>
                    setEvent({ ...event, posterTemplate: e.target.value || null })
                  }
                  rows={8}
                  className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-xs"
                  placeholder='{"hashtag":"#BMM2026","headline":[...],"stats":[...],"website":"...","socialHandle":"..."}'
                />
                <p className="mt-1 text-xs text-gray-400">
                  Controls headline colors, stats bar, footer, and QR link. Subtitle
                  field can also be a hashtag (e.g. #MKM51).
                </p>
              </div>
              <ColorField label="Primary Color" value={event.primaryColor} onChange={(v) => setEvent({ ...event, primaryColor: v })} />
              <ColorField label="Accent Color" value={event.accentColor} onChange={(v) => setEvent({ ...event, accentColor: v })} />
              <ColorField label="Background Color" value={event.backgroundColor} onChange={(v) => setEvent({ ...event, backgroundColor: v })} />
            </div>
            <label className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                checked={event.isActive}
                onChange={(e) => setEvent({ ...event, isActive: e.target.checked })}
              />
              <span className="text-sm">Event is active</span>
            </label>
          </section>

          <section className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 font-semibold">Gender / Tagline Options</h2>
            <p className="mb-4 text-sm text-gray-500">
              Configure labels in your local language. These appear on the personal DP form.
            </p>
            {event.genderOptions.map((option, i) => (
              <div key={option.key} className="mb-4 grid gap-3 rounded-lg bg-gray-50 p-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-gray-500">Label ({option.key})</label>
                  <input
                    value={option.label}
                    onChange={(e) => updateGender(i, "label", e.target.value)}
                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Tagline text</label>
                  <input
                    value={option.tagline}
                    onChange={(e) => updateGender(i, "tagline", e.target.value)}
                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  />
                </div>
              </div>
            ))}
          </section>

          {message && (
            <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-teal px-6 py-3 font-semibold text-brand-gold disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        <section className="mt-10 rounded-xl border bg-white p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-semibold">
              Submissions ({event.submissions?.length ?? 0})
            </h2>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-lg border px-3 py-1.5"
              >
                <option value="newest">Newest first</option>
                <option value="firstName">First name (A–Z)</option>
                <option value="lastName">Last name (A–Z)</option>
              </select>
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">First Name</th>
                  <th className="px-3 py-2">Last Name</th>
                  <th className="px-3 py-2">Group</th>
                  <th className="px-3 py-2">City</th>
                  <th className="px-3 py-2">Files</th>
                </tr>
              </thead>
              <tbody>
                {getSortedSubmissions().map((sub) => (
                  <tr key={sub.id} className="border-b">
                    <td className="px-3 py-2 text-gray-500">
                      {new Date(sub.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{sub.type}</td>
                    <td className="px-3 py-2">{sub.firstName ?? "—"}</td>
                    <td className="px-3 py-2">{sub.lastName ?? "—"}</td>
                    <td className="px-3 py-2">{sub.groupName ?? "—"}</td>
                    <td className="px-3 py-2">{sub.city}</td>
                    <td className="px-3 py-2">
                      {(sub.fileUploads ?? []).map((f) => (
                        <div key={f.storedName} className="text-xs text-gray-500">
                          {f.originalName} ({formatFileSize(f.sizeBytes)})
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border px-3 py-2"
      />
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border px-3 py-2 font-mono text-sm"
        />
      </div>
    </div>
  );
}
