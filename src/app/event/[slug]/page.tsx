import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toPublicEvent } from "@/lib/public-event";
import { calculateAttendeeCount } from "@/lib/participant-number";
import { EventHeader } from "@/components/EventHeader";
import { EventFooter } from "@/components/EventFooter";
import { PersonalDpForm } from "@/components/PersonalDpForm";

export default async function EventHomePage({
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

  const submissionCount = await prisma.submission.count({
    where: { eventId: event.id },
  });
  const attendeeCount = calculateAttendeeCount(
    event.participantCountBase,
    submissionCount
  );
  const publicEvent = toPublicEvent(event);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <EventHeader event={publicEvent} />
      <main className="flex-1 px-4 py-8">
        <PersonalDpForm
          event={publicEvent}
          slug={slug}
          attendeeCount={attendeeCount}
        />
      </main>
      <EventFooter event={publicEvent} />
    </div>
  );
}
