"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OrganizerLoginForm({
  slug,
  eventName,
}: {
  slug: string;
  eventName: string;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/events/${slug}/organizer/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Invalid username or password");
      return;
    }

    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
      >
        <h1 className="text-2xl font-bold text-brand-teal">{eventName}</h1>
        <p className="mt-2 text-lg leading-relaxed text-gray-500 sm:text-xl">
          Sign in to see who has created a poster for this event.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-lg font-medium leading-relaxed sm:text-xl">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full rounded-lg border px-4 py-2"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-lg font-medium leading-relaxed sm:text-xl">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border px-4 py-2"
              required
            />
          </div>

          {error && <p className="text-lg leading-relaxed text-red-600 sm:text-xl">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-teal py-3 font-semibold text-brand-gold hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>
    </main>
  );
}
