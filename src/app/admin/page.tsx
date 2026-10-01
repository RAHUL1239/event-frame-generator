import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/server-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const events = await prisma.event.findMany({
    include: {
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold text-brand-teal">Admin Dashboard</h1>
          <span className="text-sm text-gray-500">{session.user?.email}</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Events</h2>
            <Link
              href="/admin/events/new"
              className="rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-brand-gold transition hover:opacity-90"
            >
              + Create Event
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => {
              const guestLoginReady = Boolean(
                event.organizerUsername && event.organizerPasswordHash
              );
              return (
                <div
                  key={event.id}
                  className="rounded-xl border bg-white p-5 shadow-sm"
                >
                  <Link href={`/admin/events/${event.id}`} className="block">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-brand-teal">
                          {event.name}
                        </h3>
                        <p className="text-sm text-gray-500">{event.dateLabel}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          event.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {event.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {event._count.submissions} submissions
                    </p>
                  </Link>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
                    <p className="text-sm text-gray-500">
                      {guestLoginReady
                        ? `Guest login: ${event.organizerUsername}`
                        : "No guest login yet"}
                    </p>
                    <Link
                      href={`/admin/events/${event.id}#guest-login`}
                      className="shrink-0 rounded-lg bg-brand-teal px-3 py-2 text-sm font-semibold text-brand-gold hover:opacity-90"
                    >
                      Guest login
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
