import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calculateParticipantNumber } from "@/lib/participant-number";
import { EventHeader } from "@/components/EventHeader";
import { EventFooter } from "@/components/EventFooter";
import { PreviewPage } from "@/components/PreviewPage";

export default async function PreviewRoute({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      event: {
        include: { genderOptions: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!submission || submission.event.slug !== slug) notFound();

  const submissionOrdinal = await prisma.submission.count({
    where: {
      eventId: submission.eventId,
      createdAt: { lte: submission.createdAt },
    },
  });
  const participantNumber = calculateParticipantNumber(
    submission.event.participantCountBase,
    submissionOrdinal
  );

  const backPath = `/events/${slug}/personal`;

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: submission.event.backgroundColor }}
    >
      <EventHeader event={submission.event} />
      <main className="flex-1">
        <PreviewPage
          submission={submission}
          slug={slug}
          backPath={backPath}
          participantNumber={participantNumber}
        />
      </main>
      <EventFooter event={submission.event} />
    </div>
  );
}
