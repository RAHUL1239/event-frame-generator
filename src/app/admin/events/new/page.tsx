"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { slugify } from "@/lib/slug";

export default function CreateEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    subtitle: "PROFILE FRAME & POSTER GENERATOR",
    tagline: "",
    dateLabel: "",
    location: "",
    primaryColor: "#1a4d4a",
    accentColor: "#c9a227",
    backgroundColor: "#f5f0e8",
    isActive: true,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !slugTouched) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create event");
        return;
      }

      if (logoFile) {
        const formData = new FormData();
        formData.append("logo", logoFile);
        const logoRes = await fetch(`/api/admin/events/${data.id}/logo`, {
          method: "POST",
          body: formData,
        });
        if (!logoRes.ok) {
          const logoData = await logoRes.json();
          setError(
            logoData.error ??
              "Event created, but logo upload failed. You can upload it from the event settings page."
          );
          router.push(`/admin/events/${data.id}`);
          return;
        }
      }

      router.push(`/admin/events/${data.id}`);
    } catch {
      setError("Failed to create event");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back
          </Link>
          <h1 className="text-xl font-bold text-brand-teal">Create Event</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 font-semibold">Basic info</h2>
            <div className="grid gap-4">
              <Field
                label="Event name"
                required
                value={form.name}
                onChange={(v) => updateField("name", v)}
                placeholder="MKM 51st Gauravshali Sohla"
              />
              <Field
                label="URL slug"
                required
                hint={`Public URL: /events/${form.slug || "your-slug"}/personal`}
                value={form.slug}
                onChange={(v) => {
                  setSlugTouched(true);
                  updateField("slug", slugify(v));
                }}
                placeholder="mkm-51st-gauravshali-sohla"
              />
              <Field
                label="Date label"
                required
                value={form.dateLabel}
                onChange={(v) => updateField("dateLabel", v)}
                placeholder="July 17th & 18th, 2026"
              />
              <Field
                label="Footer tagline"
                required
                value={form.tagline}
                onChange={(v) => updateField("tagline", v)}
                placeholder="Event motto shown at the bottom of the site"
              />
              <Field
                label="Subtitle"
                value={form.subtitle}
                onChange={(v) => updateField("subtitle", v)}
              />
              <Field
                label="Default location"
                value={form.location}
                onChange={(v) => updateField("location", v)}
                placeholder="Washington DC"
              />
            </div>
          </section>

          <section className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 font-semibold">Branding</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <ColorField
                label="Primary color"
                value={form.primaryColor}
                onChange={(v) => updateField("primaryColor", v)}
              />
              <ColorField
                label="Accent color"
                value={form.accentColor}
                onChange={(v) => updateField("accentColor", v)}
              />
              <ColorField
                label="Background color"
                value={form.backgroundColor}
                onChange={(v) => updateField("backgroundColor", v)}
              />
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-gray-600">Logo (optional)</label>
              <p className="mt-1 text-xs text-gray-500">
                You can also upload or replace the logo after creating the event.
              </p>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="mt-2 block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-teal file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-gold"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </section>

          <section className="rounded-xl border bg-white p-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => updateField("isActive", e.target.checked)}
              />
              <span className="text-sm">Event is active (visible on home page)</span>
            </label>
            <p className="mt-3 text-sm text-gray-500">
              Default frame taglines (Male / Female / Group) are created automatically
              from the event name. You can customize them on the event settings page.
            </p>
          </section>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-teal px-6 py-3 font-semibold text-brand-gold disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create Event"}
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
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
