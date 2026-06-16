import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const events = await prisma.event.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (events.length === 1) {
    redirect(`/events/${events[0].slug}/personal`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-cream px-4">
      <div className="max-w-lg text-center">
        <h1 className="text-4xl font-bold text-brand-teal">
          Event Frame Generator
        </h1>
        <p className="mt-4 text-gray-600">
          Create personalised profile frames, posters, and WhatsApp DPs for your
          community events.
        </p>

        {events.length > 0 ? (
          <div className="mt-8 space-y-3">
            <p className="text-sm font-medium text-gray-500">
              Select an event to get started
            </p>
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}/personal`}
                className="block rounded-xl bg-white px-6 py-4 shadow-md transition hover:shadow-lg"
              >
                <span className="font-semibold text-brand-teal">
                  {event.name}
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  {event.dateLabel}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-6 py-5 text-left text-sm text-amber-900">
            <p className="font-semibold">No events are set up yet.</p>
            <p className="mt-2">
              An admin needs to create an event first. If you are setting up
              locally, run{" "}
              <code className="rounded bg-amber-100 px-1">npm run db:seed</code>{" "}
              in the project folder.
            </p>
            <Link
              href="/admin"
              className="mt-4 inline-block font-medium text-brand-teal underline"
            >
              Go to Admin →
            </Link>
          </div>
        )}

        <Link
          href="/admin"
          className="mt-8 inline-block text-sm text-gray-400 underline hover:text-gray-600"
        >
          Admin
        </Link>
      </div>
    </main>
  );
}
