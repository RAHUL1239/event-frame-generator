import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EventHeader } from "@/components/EventHeader";
import { EventFooter } from "@/components/EventFooter";
import { PersonalDpForm } from "@/components/PersonalDpForm";

export default async function PersonalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    include: { genderOptions: { orderBy: { sortOrder: "asc" } } },
  });

  if (!event || !event.isActive) notFound();

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: event.backgroundColor }}
    >
      <EventHeader
        event={event}
        activeTab="personal"
        basePath={`/events/${slug}`}
      />
      <main className="flex-1 px-4 py-8">
        <PersonalDpForm event={event} slug={slug} />
      </main>
      <EventFooter event={event} />
    </div>
  );
}
