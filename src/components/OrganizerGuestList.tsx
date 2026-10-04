"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type OrganizerGuest = {
  id: string;
  name: string;
  frameName: string;
  createdAt: string;
};

type SortOption = "newest" | "name";

export function OrganizerGuestList({
  slug,
  eventName,
  guests,
}: {
  slug: string;
  eventName: string;
  guests: OrganizerGuest[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [signingOut, setSigningOut] = useState(false);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? guests.filter((guest) => guest.name.toLowerCase().includes(needle))
      : guests;

    return [...filtered].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [guests, query, sortBy]);

  async function handleSignOut() {
    setSigningOut(true);
    await fetch(`/api/events/${slug}/organizer/logout`, { method: "POST" });
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-brand-teal">{eventName}</h1>
            <p className="text-lg leading-relaxed text-gray-500 sm:text-xl">
              {guests.length} {guests.length === 1 ? "poster" : "posters"} created
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="rounded-lg border px-4 py-2 text-base text-gray-600 hover:bg-gray-50 disabled:opacity-60"
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name"
            className="w-full max-w-xs rounded-lg border px-3 py-2 text-lg leading-relaxed sm:text-xl"
          />
          <label className="flex items-center gap-2 text-lg leading-relaxed sm:text-xl">
            <span className="text-gray-500">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border px-3 py-1.5"
            >
              <option value="newest">Newest first</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </label>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-left text-lg leading-relaxed sm:text-xl">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Frame</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={3}>
                    {guests.length === 0
                      ? "No posters have been created yet."
                      : "No names match that search."}
                  </td>
                </tr>
              ) : (
                visible.map((guest) => (
                  <tr key={guest.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{guest.name}</td>
                    <td className="px-4 py-3 text-gray-600">{guest.frameName}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(guest.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
