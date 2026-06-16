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
      genderOptions: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const recentLogs = await prisma.auditLog.findMany({
    include: {
      event: { select: { name: true } },
      admin: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="min-h-screen bg-gray-50">
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
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
              >
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
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Recent Audit Log</h2>
          <div className="overflow-hidden rounded-xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{log.action}</td>
                    <td className="px-4 py-3">{log.event?.name ?? "—"}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-gray-500">
                      {log.metadata?.slice(0, 80) ?? "—"}
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
