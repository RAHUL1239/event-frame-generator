"use client";

import { useState } from "react";

const fields = {
  name: "",
  email: "",
  phone: "",
  organization: "",
  eventName: "",
  eventDate: "",
  eventLocation: "",
  message: "",
};

export function SetupContactForm() {
  const [values, setValues] = useState(fields);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function update(field: keyof typeof fields, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Something went wrong. Please try again."
        );
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-brand-teal">Thanks — we got it</h2>
        <p className="mt-3 leading-relaxed text-gray-700">
          Your setup request is on its way. We will reach out to you soon.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-6 shadow-sm md:p-8"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700">
          Your name *
          <input
            type="text"
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 outline-none focus:border-brand-teal"
            required
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Email *
          <input
            type="email"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 outline-none focus:border-brand-teal"
            required
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Phone *
          <input
            type="tel"
            value={values.phone}
            onChange={(e) => update("phone", e.target.value)}
            autoComplete="tel"
            placeholder="Include country code if outside the US"
            className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 outline-none focus:border-brand-teal"
            required
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Organization *
          <input
            type="text"
            value={values.organization}
            onChange={(e) => update("organization", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 outline-none focus:border-brand-teal"
            required
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Event name *
          <input
            type="text"
            value={values.eventName}
            onChange={(e) => update("eventName", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 outline-none focus:border-brand-teal"
            required
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Event date
          <input
            type="text"
            value={values.eventDate}
            onChange={(e) => update("eventDate", e.target.value)}
            placeholder="e.g. July 18, 2026"
            className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 outline-none focus:border-brand-teal"
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Event location
          <input
            type="text"
            value={values.eventLocation}
            onChange={(e) => update("eventLocation", e.target.value)}
            placeholder="City or venue"
            className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 outline-none focus:border-brand-teal"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-gray-700">
        Message
        <textarea
          value={values.message}
          onChange={(e) => update("message", e.target.value)}
          rows={5}
          className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 outline-none focus:border-brand-teal"
          placeholder="Tell us about the event and when you would like to go live."
        />
      </label>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-full bg-brand-teal px-6 py-3 font-semibold text-brand-gold hover:bg-brand-teal-dark disabled:opacity-60 md:w-auto"
      >
        {loading ? "Sending..." : "Send setup request"}
      </button>
    </form>
  );
}
